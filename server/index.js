import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './pool.js';

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());

async function getActivePunishments(userId) {
  const { rows } = await pool.query('select id,type,reason,start_date as "startDate",end_date as "endDate" from punishments where user_id=$1 and (end_date is null or end_date >= current_date) order by id desc', [userId]);
  return rows.map((p) => ({ ...p, type: String(p.type).toLowerCase() }));
}
function hasPunishment(list, type) { return list.some((p) => p.type === type.toLowerCase()); }
function forbidden(res, message) { return res.status(403).json({ message }); }

const auth = (roles) => async (req, res, next) => {
  const id = Number(req.header('x-user-id'));
  if (!id) return res.status(401).json({ message: 'Unauthorized' });
  const { rows } = await pool.query('select id,nickname,role,status from users where id=$1', [id]);
  const user = rows[0];
  if (!user || user.status === 'banned') return res.status(401).json({ message: 'Blocked or not found' });
  if (!roles.includes(user.role)) return res.status(403).json({ message: 'Access denied' });
  user.punishments = await getActivePunishments(user.id);
  req.user = user;
  next();
};

async function refreshOrgMembers(orgId) {
  await pool.query('update organizations set members=(select count(*) from players where organization_id=$1) where id=$1', [orgId]);
  await pool.query('update leaders set members_count=(select count(*) from players where organization_id=$1) where organization_id=$1', [orgId]);
}

app.get('/', (_req, res) => {
  res.type('html').send('<h1>RP Role Management API</h1><p>Backend is running.</p><ul><li><a href="/api/health">/api/health</a></li></ul>');
});
app.get('/api', (_req, res) => res.json({ name: 'RP Role Management API', status: 'running', health: '/api/health' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/login', async (req, res) => {
  const { nickname, password } = req.body;
  const { rows } = await pool.query('select id,nickname,email,role,status,last_login as "lastLogin",birth_date as "birthDate",profile_description as "profileDescription" from users where lower(nickname)=lower($1) and password=$2', [nickname, password]);
  const user = rows[0];
  if (!user || user.status === 'banned') return res.status(401).json({ message: 'Invalid login or blocked account' });
  await pool.query('update users set last_login=now() where id=$1', [user.id]);
  user.punishments = await getActivePunishments(user.id);
  res.json(user);
});

app.get('/api/profile', auth(['player','leader','admin']), async (req, res) => {
  const { rows } = await pool.query('select id,nickname,email,role,status,last_login as "lastLogin",birth_date as "birthDate",profile_description as "profileDescription" from users where id=$1', [req.user.id]);
  res.json({ ...rows[0], punishments: req.user.punishments });
});

app.put('/api/profile', auth(['player','leader','admin']), async (req, res) => {
  if (hasPunishment(req.user.punishments, 'ban')) return forbidden(res, 'Ban: profile editing is restricted');
  const { email, birthDate, profileDescription } = req.body;
  const { rows } = await pool.query('update users set email=$1,birth_date=$2,profile_description=$3 where id=$4 returning id,nickname,email,role,status,last_login as "lastLogin",birth_date as "birthDate",profile_description as "profileDescription"', [email || null, birthDate || null, profileDescription || '', req.user.id]);
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, 'Оновив дані профілю']);
  res.json({ ...rows[0], punishments: await getActivePunishments(req.user.id) });
});

app.get('/api/users', auth(['leader','admin']), async (req, res) => {
  const emailField = req.user.role === 'admin' ? 'email' : 'null as email';
  const { rows } = await pool.query('select id,nickname,' + emailField + ',role,status,last_login as "lastLogin",birth_date as "birthDate",profile_description as "profileDescription" from users order by id');
  res.json(rows);
});

app.get('/api/players', auth(['player','leader','admin']), async (req, res) => {
  if (req.user.role !== 'admin' && hasPunishment(req.user.punishments, 'ban')) return forbidden(res, 'Ban: player profiles are restricted');
  if (req.user.role !== 'admin' && hasPunishment(req.user.punishments, 'warning')) return forbidden(res, 'Warning: player profile checking is restricted');
  const emailField = req.user.role === 'admin' ? 'u.email' : 'null as email';
  const { rows } = await pool.query('select p.id,p.user_id as "userId",u.nickname,' + emailField + ',u.role,u.status,u.birth_date as "birthDate",u.profile_description as "profileDescription",p.level,p.experience,p.reputation,p.organization_id as "organizationId",o.name as organization from players p join users u on u.id=p.user_id left join organizations o on o.id=p.organization_id order by p.id');
  res.json(rows);
});

app.get('/api/leader/organization', auth(['leader']), async (req, res) => {
  const { rows } = await pool.query('select o.id,o.name,o.type,o.rating,o.created_at as "createdAt",o.members,l.rank,l.members_count as "membersCount" from leaders l join organizations o on o.id=l.organization_id where l.user_id=$1', [req.user.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Leader organization not found' });
  res.json(rows[0]);
});

app.get('/api/organizations', auth(['player','leader','admin']), async (_req, res) => {
  const { rows } = await pool.query('select id,name,type,rating,created_at as "createdAt",members from organizations order by id');
  res.json(rows);
});

app.get('/api/rules', auth(['player','leader','admin']), async (req, res) => {
  const sql = req.user.role === 'admin' ? 'select id,category,title,text,access,updated_at as "updatedAt" from rules order by id' : 'select id,category,title,text,access,updated_at as "updatedAt" from rules where access in ($1,$2) order by id';
  const params = req.user.role === 'admin' ? [] : ['all', req.user.role];
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

app.post('/api/rules', auth(['admin']), async (req, res) => {
  const { category, title, text, access } = req.body;
  const { rows } = await pool.query('insert into rules(category,title,text,access,updated_at) values($1,$2,$3,$4,current_date) returning id,category,title,text,access,updated_at as "updatedAt"', [category, title, text, access]);
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, 'Створив правило: ' + title]);
  res.status(201).json(rows[0]);
});

app.put('/api/rules/:id', auth(['admin']), async (req, res) => {
  const { category, title, text, access } = req.body;
  const { rows } = await pool.query('update rules set category=$1,title=$2,text=$3,access=$4,updated_at=current_date where id=$5 returning id,category,title,text,access,updated_at as "updatedAt"', [category, title, text, access, req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Rule not found' });
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, 'Оновив правило: ' + title]);
  res.json(rows[0]);
});

app.delete('/api/rules/:id', auth(['admin']), async (req, res) => {
  const { rows } = await pool.query('delete from rules where id=$1 returning title', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Rule not found' });
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, 'Видалив правило: ' + rows[0].title]);
  res.status(204).end();
});

app.get('/api/applications', auth(['player','leader','admin']), async (req, res) => {
  let sql = 'select a.id,u.nickname as applicant,o.name as organization,a.type,a.status,a.submitted_at as "submittedAt" from applications a join users u on u.id=a.applicant_id join organizations o on o.id=a.organization_id';
  const params = [];
  if (req.user.role === 'player') { sql += ' where a.applicant_id=$1'; params.push(req.user.id); }
  if (req.user.role === 'leader') { sql += ' join leaders l on l.organization_id=a.organization_id where l.user_id=$1'; params.push(req.user.id); }
  const { rows } = await pool.query(sql + ' order by a.id', params);
  res.json(rows);
});

app.post('/api/applications', auth(['player']), async (req, res) => {
  if (hasPunishment(req.user.punishments, 'ban')) return forbidden(res, 'Ban: applications are restricted');
  if (hasPunishment(req.user.punishments, 'warning')) return forbidden(res, 'Warning: applications are restricted');
  const { organizationId, type } = req.body;
  const { rows } = await pool.query('insert into applications(applicant_id,organization_id,type,status,submitted_at) values($1,$2,$3,$4,now()) returning id, applicant_id as "applicantId", organization_id as "organizationId", type, status, submitted_at as "submittedAt"', [req.user.id, Number(organizationId), type || 'join_organization', 'pending']);
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, 'Подав заявку до організації #' + organizationId]);
  res.status(201).json(rows[0]);
});

app.patch('/api/applications/:id/status', auth(['leader','admin']), async (req, res) => {
  const { status } = req.body;
  if (!['pending','approved','rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const { rows } = await pool.query('update applications set status=$1 where id=$2 returning id,status,applicant_id as "applicantId",organization_id as "organizationId"', [status, req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Application not found' });
  if (status === 'approved') { await pool.query('update players set organization_id=$1 where user_id=$2', [rows[0].organizationId, rows[0].applicantId]); await refreshOrgMembers(rows[0].organizationId); }
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, 'Змінив статус заявки #' + req.params.id + ' на ' + status]);
  res.json(rows[0]);
});

app.patch('/api/players/:userId/organization', auth(['leader','admin']), async (req, res) => {
  const userId = Number(req.params.userId);
  let organizationId = req.body.organizationId === null || req.body.organizationId === '' ? null : Number(req.body.organizationId);
  if (req.user.role === 'leader') {
    const { rows } = await pool.query('select organization_id from leaders where user_id=$1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Leader organization not found' });
    if (organizationId !== null && organizationId !== rows[0].organization_id) return res.status(403).json({ message: 'Leader can manage only own organization' });
  }
  const before = await pool.query('select organization_id from players where user_id=$1', [userId]);
  const oldOrg = before.rows[0]?.organization_id;
  const { rows } = await pool.query('update players set organization_id=$1 where user_id=$2 returning user_id as "userId", organization_id as "organizationId"', [organizationId, userId]);
  if (!rows[0]) return res.status(404).json({ message: 'Player not found' });
  if (oldOrg) await refreshOrgMembers(oldOrg);
  if (organizationId) await refreshOrgMembers(organizationId);
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, organizationId ? 'Додав користувача #' + userId + ' до організації #' + organizationId : 'Видалив користувача #' + userId + ' з організації']);
  res.json(rows[0]);
});

app.get('/api/punishments', auth(['admin']), async (_req, res) => {
  const { rows } = await pool.query('select p.id,u.nickname,p.type,p.reason,p.start_date as "startDate",p.end_date as "endDate" from punishments p join users u on u.id=p.user_id order by p.id');
  res.json(rows);
});

app.post('/api/punishments', auth(['admin']), async (req, res) => {
  const { userId, type, reason, endDate } = req.body;
  const cleanType = String(type || 'warning').toLowerCase();
  if (!['warning','ban','mute'].includes(cleanType)) return res.status(400).json({ message: 'Invalid punishment type' });
  const { rows } = await pool.query('insert into punishments(user_id,type,reason,start_date,end_date) values($1,$2,$3,current_date,$4) returning id,user_id as "userId",type,reason,start_date as "startDate",end_date as "endDate"', [userId, cleanType, reason, endDate || null]);
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, 'Видав покарання ' + cleanType + ' користувачу #' + userId]);
  res.status(201).json(rows[0]);
});

app.get('/api/forum/messages', auth(['player','leader','admin']), async (req, res) => {
  if (hasPunishment(req.user.punishments, 'ban')) return forbidden(res, 'Ban: forum chat reading is restricted');
  const { rows } = await pool.query('select m.id,m.message,m.created_at as "createdAt",u.nickname,u.role from forum_messages m join users u on u.id=m.user_id order by m.created_at asc limit 100');
  res.json(rows);
});

app.post('/api/forum/messages', auth(['player','leader','admin']), async (req, res) => {
  if (hasPunishment(req.user.punishments, 'ban')) return forbidden(res, 'Ban: forum chat is restricted');
  if (hasPunishment(req.user.punishments, 'mute')) return forbidden(res, 'Mute: sending messages is restricted');
  const message = String(req.body.message || '').trim();
  if (!message) return res.status(400).json({ message: 'Message is empty' });
  const { rows } = await pool.query('insert into forum_messages(user_id,message,created_at) values($1,$2,now()) returning id,message,created_at as "createdAt"', [req.user.id, message]);
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, 'Надіслав повідомлення у загальний чат']);
  res.status(201).json({ ...rows[0], nickname: req.user.nickname, role: req.user.role });
});

app.get('/api/logs', auth(['leader','admin']), async (_req, res) => {
  const { rows } = await pool.query('select l.id,u.nickname,l.action,l.timestamp from logs l join users u on u.id=l.user_id order by l.timestamp desc');
  res.json(rows);
});

app.listen(PORT, () => console.log('Server started on http://localhost:' + PORT));
