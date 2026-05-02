INSERT INTO users (id, nickname, password, email, role, status, last_login) VALUES
(1,'John_Vancheti','Player123!','john.vancheti@rp.local','player','active','2026-05-01 19:30'),
(2,'Henry_Orlov','Admin123!','henry.orlov@rp.local','admin','active','2026-05-02 10:10'),
(3,'Alex_Moreno','Leader123!','alex.moreno@rp.local','leader','active','2026-05-01 21:05'),
(4,'Mark_Daniels','Player456!','mark.daniels@rp.local','player','banned','2026-04-25 15:40'),
(5,'Olivia_Stone','Player789!','olivia.stone@rp.local','player','active','2026-05-02 08:15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, name, type, rating, created_at, members) VALUES
(1,'Los Santos Police Department','state',4.8,'2025-09-10',12),
(2,'Emergency Medical Service','state',4.6,'2025-10-02',8),
(3,'Vanchetti Family','family',4.1,'2025-11-15',16),
(4,'MerryWeather Security','private',4.3,'2025-12-21',10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO players (id,user_id,level,experience,reputation,organization_id) VALUES
(1,1,18,4520,87,1),(2,4,9,1480,21,NULL),(3,5,14,3210,74,2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO admins (id,user_id,access_level,permissions,super_admin) VALUES
(1,2,5,'{users,roles,rules,punishments,logs}',true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO leaders (id,user_id,organization_id,rank,members_count) VALUES
(1,3,1,'Director',12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rules (id,category,title,text,access,updated_at) VALUES
(1,'Загальні правила','Поважна поведінка','Користувачі повинні дотримуватися правил RP та поважати інших гравців.','all','2026-04-20'),
(2,'Role Play','Дотримання ролі','Усі дії персонажа мають відповідати логіці обраної ролі та ситуації.','all','2026-04-22'),
(3,'Організації','Вступ до організації','Вступ можливий після подання заявки та її схвалення лідером або адміністратором.','player','2026-04-24'),
(4,'Адміністрація','Видача покарань','Покарання фіксуються у журналі дій із зазначенням причини та відповідальної особи.','admin','2026-04-27')
ON CONFLICT (id) DO NOTHING;

INSERT INTO applications (id,applicant_id,organization_id,type,status,submitted_at) VALUES
(1,1,1,'join_organization','pending','2026-05-01 17:30'),
(2,5,2,'join_organization','approved','2026-04-28 13:20')
ON CONFLICT (id) DO NOTHING;

INSERT INTO punishments (id,user_id,type,reason,start_date,end_date) VALUES
(1,4,'ban','Порушення правил сервера','2026-04-25','2026-05-25')
ON CONFLICT (id) DO NOTHING;

INSERT INTO logs (id,user_id,action,timestamp) VALUES
(1,2,'Видав покарання користувачу Mark_Daniels','2026-04-25 15:42'),
(2,3,'Схвалив заявку Olivia_Stone до EMS','2026-04-28 13:40')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval('organizations_id_seq', COALESCE((SELECT MAX(id) FROM organizations), 1), true);
SELECT setval('players_id_seq', COALESCE((SELECT MAX(id) FROM players), 1), true);
SELECT setval('admins_id_seq', COALESCE((SELECT MAX(id) FROM admins), 1), true);
SELECT setval('leaders_id_seq', COALESCE((SELECT MAX(id) FROM leaders), 1), true);
SELECT setval('rules_id_seq', COALESCE((SELECT MAX(id) FROM rules), 1), true);
SELECT setval('applications_id_seq', COALESCE((SELECT MAX(id) FROM applications), 1), true);
SELECT setval('punishments_id_seq', COALESCE((SELECT MAX(id) FROM punishments), 1), true);
SELECT setval('logs_id_seq', COALESCE((SELECT MAX(id) FROM logs), 1), true);
