import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './pool.js';

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());

const auth = (roles) => async (req, res, next) => {
  const id = Number(req.header('x-user-id'));
  if (!id) return res.status(401).json({ message: 'Unauthorized' });
  const { rows } = await pool.query('select id,nickname,role,status from users where id=$1', [id]);
  const user = rows[0];
  if (!user || user.status === 'banned') return res.status(401).json({ message: 'Blocked or not found' });
  if (!roles.includes(user.role)) return res.status(403).json({ message: 'Access denied' });
  req.user = user;
  next();
};

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/login', async (req, res) => {
  const { nickname, password } = req.body;
  const { rows } = await pool.query('select id,nickname,email,role,status,last_login as "lastLogin" from users where lower(nickname)=lower($1) and password=$2', [nickname, password]);
  const user = rows[0];
  if (!user || user.status === 'banned') return res.status(401).json({ message: 'Invalid login or blocked account' });
  await pool.query('update users set last_login=now() where id=$1', [user.id]);
  res.json(user);
});

app.get('/api/users', auth(['leader','admin']), async (_req, res) => {
  const { rows } = await pool.query('select id,nickname,email,role,status,last_login as "lastLogin" from users order by id');
  res.json(rows);
});

app.get('/api/players', auth(['leader','admin']), async (_req, res) => {
  const { rows } = await pool.query('select p.id,p.user_id as "userId",u.nickname,u.role,u.status,p.level,p.experience,p.reputation,o.name as organization from players p join users u on u.id=p.user_id left join organizations o on o.id=p.organization_id order by p.id');
  res.json(rows);
});

app.get('/api/organizations', auth(['player','leader','admin']), async (_req, res) => {
  const { rows } = await pool.query('select id,name,type,rating,created_at as "createdAt",members from organizations order by id');
  res.json(rows);
});

app.get('/api/rules', auth(['player','leader','admin']), async (req, res) => {
  const sql = req.user.role === 'admin'
    ? 'select id,category,title,text,access,updated_at as "updatedAt" from rules order by id'
    : 'select id,category,title,text,access,updated_at as "updatedAt" from rules where access in ($1,$2) order by id';
  const params = req.user.role === 'admin' ? [] : ['all', req.user.role];
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

app.post('/api/rules', auth(['admin']), async (req, res) => {
  const { category, title, text, access } = req.body;
  const { rows } = await pool.query('insert into rules(category,title,text,access,updated_at) values($1,$2,$3,$4,current_date) returning id,category,title,text,access,updated_at as "updatedAt"', [category, title, text, access]);
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, `Створив правило: ${title}`]);
  res.status(201).json(rows[0]);
});

app.put('/api/rules/:id', auth(['admin']), async (req, res) => {
  const { category, title, text, access } = req.body;
  const { rows } = await pool.query('update rules set category=$1,title=$2,text=$3,access=$4,updated_at=current_date where id=$5 returning id,category,title,text,access,updated_at as "updatedAt"', [category, title, text, access, req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Rule not found' });
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, `Оновив правило: ${title}`]);
  res.json(rows[0]);
});

app.delete('/api/rules/:id', auth(['admin']), async (req, res) => {
  const { rows } = await pool.query('delete from rules where id=$1 returning title', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Rule not found' });
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, `Видалив правило: ${rows[0].title}`]);
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

app.patch('/api/applications/:id/status', auth(['leader','admin']), async (req, res) => {
  const { status } = req.body;
  const { rows } = await pool.query('update applications set status=$1 where id=$2 returning id,status', [status, req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Application not found' });
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, `Змінив статус заявки #${req.params.id} на ${status}`]);
  res.json(rows[0]);
});

app.get('/api/punishments', auth(['admin']), async (_req, res) => {
  const { rows } = await pool.query('select p.id,u.nickname,p.type,p.reason,p.start_date as "startDate",p.end_date as "endDate" from punishments p join users u on u.id=p.user_id order by p.id');
  res.json(rows);
});

app.post('/api/punishments', auth(['admin']), async (req, res) => {
  const { userId, type, reason, endDate } = req.body;
  const { rows } = await pool.query('insert into punishments(user_id,type,reason,start_date,end_date) values($1,$2,$3,current_date,$4) returning id,user_id as "userId",type,reason,start_date as "startDate",end_date as "endDate"', [userId, type, reason, endDate]);
  await pool.query('insert into logs(user_id,action,timestamp) values($1,$2,now())', [req.user.id, `Видав покарання користувачу #${userId}`]);
  res.status(201).json(rows[0]);
});

app.get('/api/logs', auth(['leader','admin']), async (_req, res) => {
  const { rows } = await pool.query('select l.id,u.nickname,l.action,l.timestamp from logs l join users u on u.id=l.user_id order by l.timestamp desc');
  res.json(rows);
});

app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
