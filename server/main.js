import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:4000/api/auth/discord/callback';

app.use(cors());
app.use(express.json());

async function activePunishments(userId) {
  const { rows } = await pool.query('select id,type,reason,start_date as "startDate",end_date as "endDate" from punishments where user_id=$1 and (end_date is null or end_date >= current_date) order by id desc', [userId]);
  return rows.map((p) => ({ ...p, type: String(p.type).toLowerCase() }));
}
function hasPunishment(list, type) { return list.some((p) => p.type === type.toLowerCase()); }
function deny(res, message) { return res.status(403).json({ message }); }

const auth = (roles) => async (req, res, next) => {
  const id = Number(req.header('x-user-id'));
  if (!id) return res.status(401).json({ message: 'Unauthorized' });
  const { rows } = await pool.query('select id,nickname,role,status from users where id=$1', [id]);
  const user = rows[0];
  if (!user || user.status === 'banned') return res.status(401).json({ message: 'Blocked or not found' });
  if (!roles.includes(user.role)) return res.status(403).json({ message: 'Access denied' });
  user.punishments = await activePunishments(user.id);
  req.user = user;
  next();
};
async function log(userId, action) { await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [userId, action]); }
async function refreshOrgMembers(orgId) {
  await pool.query('update organizations set members=(select count(*) from players where organization_id=$1) where id=$1', [orgId]);
  await pool.query('update leaders set members_count=(select count(*) from players where organization_id=$1) where organization_id=$1', [orgId]);
}
async function publicUser(userId) {
  const { rows } = await pool.query('select id,nickname,email,role,status,last_login as "lastLogin",birth_date as "birthDate",profile_description as "profileDescription" from users where id=$1', [userId]);
  return rows[0] ? { ...rows[0], punishments: await activePunishments(userId) } : null;
}

app.get('/', (_req, res) => res.type('html').send('<h1>RP Role Management API</h1><p>Backend is running.</p><a href="/api/health">/api/health</a>'));
app.get('/api', (_req, res) => res.json({ name: 'RP Role Management API', status: 'running' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/login', async (req, res) => {
  const { nickname, password } = req.body;
  const { rows } = await pool.query('select * from users where lower(nickname)=lower($1)', [nickname]);
  const user = rows[0];
  if (!user || user.status === 'banned') return res.status(401).json({ message: 'Invalid login or blocked account' });
  let ok = false;
  if (user.password_hash) ok = await bcrypt.compare(password, user.password_hash).catch(() => false);
  if (!ok && user.password === password) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('update users set password_hash=$1 where id=$2', [hash, user.id]);
    ok = true;
  }
  if (!ok) return res.status(401).json({ message: 'Invalid login or blocked account' });
  await pool.query('update users set last_login=now() where id=$1', [user.id]);
  res.json(await publicUser(user.id));
});

app.get('/api/auth/discord/url', (_req, res) => {
  if (!DISCORD_CLIENT_ID) return res.status(400).json({ message: 'DISCORD_CLIENT_ID is not configured' });
  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', DISCORD_CLIENT_ID);
  url.searchParams.set('redirect_uri', DISCORD_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify email');
  res.json({ url: url.toString() });
});

app.get('/api/auth/discord/callback', async (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) return res.redirect(CLIENT_URL + '?discord=not_configured');
  const code = req.query.code;
  if (!code) return res.redirect(CLIENT_URL + '?discord=no_code');
  const body = new URLSearchParams({ client_id: DISCORD_CLIENT_ID, client_secret: DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: DISCORD_REDIRECT_URI });
  const token = await fetch('https://discord.com/api/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }).then(r => r.json());
  if (!token.access_token) return res.redirect(CLIENT_URL + '?discord=token_error');
  const discordUser = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: token.token_type + ' ' + token.access_token } }).then(r => r.json());
  if (!discordUser.id) return res.redirect(CLIENT_URL + '?discord=user_error');
  const nickname = discordUser.global_name || discordUser.username || ('discord_' + discordUser.id);
  const email = discordUser.email || null;
  const found = await pool.query('select id from users where discord_id=$1 or lower(nickname)=lower($2)', [discordUser.id, nickname]);
  let id = found.rows[0]?.id;
  if (!id) {
    const tempHash = await bcrypt.hash(Math.random().toString(36), 10);
    const created = await pool.query('insert into users(nickname,password,password_hash,email,role,status,discord_id,last_login) values($1,$2,$3,$4,$5,$6,$7,now()) returning id', [nickname, '', tempHash, email, 'player', 'active', discordUser.id]);
    id = created.rows[0].id;
    await pool.query('insert into players(user_id,level,experience,reputation) values($1,1,0,0) on conflict do nothing', [id]);
  } else {
    await pool.query('update users set discord_id=$1,email=coalesce(email,$2),last_login=now() where id=$3', [discordUser.id, email, id]);
  }
  res.redirect(CLIENT_URL + '?discord_user_id=' + id);
});

app.get('/api/profile', auth(['player','leader','admin']), async (req, res) => res.json(await publicUser(req.user.id)));
app.put('/api/profile', auth(['player','leader','admin']), async (req, res) => {
  if (hasPunishment(req.user.punishments, 'ban')) return deny(res, 'Ban: profile editing is restricted');
  const { email, birthDate, profileDescription } = req.body;
  await pool.query('update users set email=$1,birth_date=$2,profile_description=$3 where id=$4', [email || null, birthDate || null, profileDescription || '', req.user.id]);
  await log(req.user.id, 'Оновив дані профілю');
  res.json(await publicUser(req.user.id));
});

app.get('/api/users', auth(['leader','admin']), async (req, res) => {
  const emailField = req.user.role === 'admin' ? 'email' : 'null as email';
  const { rows } = await pool.query('select id,nickname,' + emailField + ',role,status,last_login as "lastLogin",birth_date as "birthDate",profile_description as "profileDescription" from users order by id');
  res.json(rows);
});
app.patch('/api/users/:id/role', auth(['admin']), async (req, res) => {
  const userId = Number(req.params.id);
  const { role, organizationId } = req.body;
  if (!['player','leader','admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  await pool.query('update users set role=$1 where id=$2', [role, userId]);
  if (role === 'player') { await pool.query('insert into players(user_id,level,experience,reputation) values($1,1,0,0) on conflict do nothing', [userId]); await pool.query('delete from admins where user_id=$1', [userId]); await pool.query('delete from leaders where user_id=$1', [userId]); }
  if (role === 'admin') { await pool.query('insert into admins(user_id,access_level,permissions,super_admin) values($1,3,$2,false) on conflict do nothing', [userId, ['users','rules','logs']]); await pool.query('delete from leaders where user_id=$1', [userId]); }
  if (role === 'leader') { if (!organizationId) return res.status(400).json({ message: 'organizationId required for leader' }); await pool.query('insert into leaders(user_id,organization_id,rank,members_count) values($1,$2,$3,0) on conflict (user_id) do update set organization_id=excluded.organization_id', [userId, Number(organizationId), 'Leader']); await pool.query('delete from admins where user_id=$1', [userId]); }
  await log(req.user.id, 'Змінив роль користувача #' + userId + ' на ' + role);
  res.json(await publicUser(userId));
});

app.get('/api/players', auth(['player','leader','admin']), async (req, res) => {
  if (req.user.role !== 'admin' && hasPunishment(req.user.punishments, 'ban')) return deny(res, 'Ban: player profiles are restricted');
  if (req.user.role !== 'admin' && hasPunishment(req.user.punishments, 'warning')) return deny(res, 'Warning: player profile checking is restricted');
  const emailField = req.user.role === 'admin' ? 'u.email' : 'null as email';
  const { rows } = await pool.query('select p.id,p.user_id as "userId",u.nickname,' + emailField + ',u.role,u.status,u.birth_date as "birthDate",u.profile_description as "profileDescription",p.level,p.experience,p.reputation,p.organization_id as "organizationId",o.name as organization from players p join users u on u.id=p.user_id left join organizations o on o.id=p.organization_id order by p.id');
  res.json(rows);
});

app.get('/api/organizations', auth(['player','leader','admin']), async (_req, res) => { const { rows } = await pool.query('select id,name,type,rating,created_at as "createdAt",members from organizations order by id'); res.json(rows); });
app.post('/api/organizations', auth(['admin']), async (req, res) => { const { name, type, rating } = req.body; const { rows } = await pool.query('insert into organizations(name,type,rating,created_at,members) values($1,$2,$3,current_date,0) returning id,name,type,rating,created_at as "createdAt",members', [name, type, rating || 0]); await log(req.user.id, 'Створив організацію ' + name); res.status(201).json(rows[0]); });
app.put('/api/organizations/:id', auth(['admin']), async (req, res) => { const { name, type, rating } = req.body; const { rows } = await pool.query('update organizations set name=$1,type=$2,rating=$3 where id=$4 returning id,name,type,rating,created_at as "createdAt",members', [name, type, rating || 0, req.params.id]); await log(req.user.id, 'Оновив організацію #' + req.params.id); res.json(rows[0]); });
app.delete('/api/organizations/:id', auth(['admin']), async (req, res) => { await pool.query('update players set organization_id=null where organization_id=$1', [req.params.id]); await pool.query('delete from leaders where organization_id=$1', [req.params.id]); await pool.query('delete from applications where organization_id=$1', [req.params.id]); await pool.query('delete from organizations where id=$1', [req.params.id]); await log(req.user.id, 'Видалив організацію #' + req.params.id); res.status(204).end(); });

app.get('/api/rules', auth(['player','leader','admin']), async (req, res) => { const sql = req.user.role === 'admin' ? 'select id,category,title,text,access,updated_at as "updatedAt" from rules order by id' : 'select id,category,title,text,access,updated_at as "updatedAt" from rules where access in ($1,$2) order by id'; const params = req.user.role === 'admin' ? [] : ['all', req.user.role]; const { rows } = await pool.query(sql, params); res.json(rows); });
app.post('/api/rules', auth(['admin']), async (req, res) => { const { category, title, text, access } = req.body; const { rows } = await pool.query('insert into rules(category,title,text,access,updated_at) values($1,$2,$3,$4,current_date) returning id,category,title,text,access,updated_at as "updatedAt"', [category, title, text, access]); await log(req.user.id, 'Створив правило: ' + title); res.status(201).json(rows[0]); });
app.put('/api/rules/:id', auth(['admin']), async (req, res) => { const { category, title, text, access } = req.body; const { rows } = await pool.query('update rules set category=$1,title=$2,text=$3,access=$4,updated_at=current_date where id=$5 returning id,category,title,text,access,updated_at as "updatedAt"', [category, title, text, access, req.params.id]); await log(req.user.id, 'Оновив правило: ' + title); res.json(rows[0]); });
app.delete('/api/rules/:id', auth(['admin']), async (req, res) => { await pool.query('delete from rules where id=$1', [req.params.id]); await log(req.user.id, 'Видалив правило #' + req.params.id); res.status(204).end(); });

app.get('/api/applications', auth(['player','leader','admin']), async (req, res) => { let sql='select a.id,u.nickname as applicant,o.name as organization,a.type,a.status,a.submitted_at as "submittedAt" from applications a join users u on u.id=a.applicant_id join organizations o on o.id=a.organization_id'; const params=[]; if(req.user.role==='player'){sql+=' where a.applicant_id=$1';params.push(req.user.id);} if(req.user.role==='leader'){sql+=' join leaders l on l.organization_id=a.organization_id where l.user_id=$1';params.push(req.user.id);} const {rows}=await pool.query(sql+' order by a.id',params); res.json(rows); });
app.post('/api/applications', auth(['player']), async (req, res) => { if(hasPunishment(req.user.punishments,'ban'))return deny(res,'Ban: applications are restricted'); if(hasPunishment(req.user.punishments,'warning'))return deny(res,'Warning: applications are restricted'); const { organizationId, type }=req.body; const exists=await pool.query('select id from applications where applicant_id=$1 and organization_id=$2 and status in ($3,$4,$5)',[req.user.id,Number(organizationId),'pending','reviewing','needs_info']); if(exists.rows[0])return res.status(409).json({message:'Active application already exists'}); const { rows }=await pool.query('insert into applications(applicant_id,organization_id,type,status,submitted_at) values($1,$2,$3,$4,now()) returning id,type,status,submitted_at as "submittedAt"',[req.user.id,Number(organizationId),type||'join_organization','pending']); await log(req.user.id,'Подав заявку до організації #'+organizationId); res.status(201).json(rows[0]); });
app.patch('/api/applications/:id/status', auth(['leader','admin']), async (req, res) => { const { status }=req.body; if(!['pending','reviewing','needs_info','approved','rejected'].includes(status))return res.status(400).json({message:'Invalid status'}); const { rows }=await pool.query('update applications set status=$1 where id=$2 returning id,status,applicant_id as "applicantId",organization_id as "organizationId"',[status,req.params.id]); if(status==='approved'&&rows[0]){await pool.query('update players set organization_id=$1 where user_id=$2',[rows[0].organizationId,rows[0].applicantId]); await refreshOrgMembers(rows[0].organizationId);} await log(req.user.id,'Змінив статус заявки #'+req.params.id+' на '+status); res.json(rows[0]); });

app.get('/api/punishments', auth(['admin']), async (_req, res) => { const { rows }=await pool.query('select p.id,u.nickname,p.type,p.reason,p.start_date as "startDate",p.end_date as "endDate" from punishments p join users u on u.id=p.user_id order by p.id'); res.json(rows); });
app.post('/api/punishments', auth(['admin']), async (req,res)=>{const {userId,type,reason,endDate}=req.body; const clean=String(type||'warning').toLowerCase(); if(!['warning','ban','mute'].includes(clean))return res.status(400).json({message:'Invalid punishment type'}); const {rows}=await pool.query('insert into punishments(user_id,type,reason,start_date,end_date) values($1,$2,$3,current_date,$4) returning id,user_id as "userId",type,reason,start_date as "startDate",end_date as "endDate"',[userId,clean,reason,endDate||null]); await log(req.user.id,'Видав покарання '+clean+' користувачу #'+userId); res.status(201).json(rows[0]);});
app.patch('/api/punishments/:id/cancel', auth(['admin']), async (req,res)=>{const {rows}=await pool.query('update punishments set end_date=current_date where id=$1 returning id,type,reason,start_date as "startDate",end_date as "endDate",user_id as "userId"',[req.params.id]); await log(req.user.id,'Скасував покарання #'+req.params.id); res.json(rows[0]);});

app.get('/api/reports/activity', auth(['admin']), async (_req,res)=>{const {rows}=await pool.query('select u.nickname,u.role,u.status,u.last_login as "lastLogin",count(l.id) as actions from users u left join logs l on l.user_id=u.id group by u.id order by u.id');res.json(rows);});
app.get('/api/reports/players', auth(['admin']), async (_req,res)=>{const {rows}=await pool.query('select u.nickname,p.level,p.experience,p.reputation,o.name as organization from players p join users u on u.id=p.user_id left join organizations o on o.id=p.organization_id order by p.id');res.json(rows);});
app.get('/api/reports/organizations', auth(['admin']), async (_req,res)=>{const {rows}=await pool.query('select o.name,o.type,o.rating,o.members,u.nickname as leader from organizations o left join leaders l on l.organization_id=o.id left join users u on u.id=l.user_id order by o.id');res.json(rows);});
app.get('/api/reports/applications', auth(['admin']), async (_req,res)=>{const {rows}=await pool.query('select status,count(*) from applications group by status order by status');res.json(rows);});
app.get('/api/reports/punishments', auth(['admin']), async (_req,res)=>{const {rows}=await pool.query('select u.nickname,p.type,p.reason,p.start_date as "startDate",p.end_date as "endDate" from punishments p join users u on u.id=p.user_id order by p.id');res.json(rows);});

app.get('/api/forum/messages', auth(['player','leader','admin']), async (req,res)=>{if(hasPunishment(req.user.punishments,'ban'))return deny(res,'Ban: forum chat reading is restricted'); const {rows}=await pool.query('select m.id,m.message,m.created_at as "createdAt",u.nickname,u.role from forum_messages m join users u on u.id=m.user_id order by m.created_at asc limit 100');res.json(rows);});
app.post('/api/forum/messages', auth(['player','leader','admin']), async (req,res)=>{if(hasPunishment(req.user.punishments,'ban'))return deny(res,'Ban: forum chat is restricted'); if(hasPunishment(req.user.punishments,'mute'))return deny(res,'Mute: sending messages is restricted'); const message=String(req.body.message||'').trim(); if(!message)return res.status(400).json({message:'Message is empty'}); const {rows}=await pool.query('insert into forum_messages(user_id,message,created_at) values($1,$2,now()) returning id,message,created_at as "createdAt"',[req.user.id,message]); await log(req.user.id,'Надіслав повідомлення у загальний чат'); res.status(201).json({...rows[0],nickname:req.user.nickname,role:req.user.role});});
app.get('/api/logs', auth(['leader','admin']), async (_req,res)=>{const {rows}=await pool.query('select l.id,u.nickname,l.action,l.timestamp from logs l join users u on u.id=l.user_id order by l.timestamp desc');res.json(rows);});
app.listen(PORT,()=>console.log('Server started on http://localhost:'+PORT));
