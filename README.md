# RP Role Management System

Курсовий проєкт з дисципліни «Проєктування інформаційних систем».

## Тема

Інформаційна система управління ролями, правилами та заявками для мультиплеєрних рольових серверів.

## Поточна реалізація

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Мова інтерфейсу: UA / ENG
- Авторизація: nickname + password, Discord OAuth
- Рольовий доступ: player, leader, admin
- CRUD для правил: адміністратор може додавати, редагувати та видаляти правила через сайт
- Форми дій: розгляд заявок лідером/адміністратором, видача покарання адміністратором
- Discord bot sync: синхронізація ролей сайту, покарань і ролей організацій із Discord-сервером

## Структура даних

Таблиці сформовано відповідно до логіки лабораторних робіт:

- users
- players
- admins
- leaders
- organizations
- rules
- applications
- punishments
- logs
- forum_messages

## Налаштування PostgreSQL

Створи базу даних:

```bash
createdb rp_role_management
```

Виконай SQL-файли:

```bash
psql -d rp_role_management -f database/schema.sql
psql -d rp_role_management -f database/seed.sql
```

Якщо база вже створена раніше, виконай міграції:

```bash
psql -d rp_role_management -f database/migrations/001_user_profile_fields.sql
psql -d rp_role_management -f database/migrations/002_forum_chat.sql
psql -d rp_role_management -f database/migrations/003_auth_roles_reports_orgs.sql
psql -d rp_role_management -f database/migrations/004_discord_role_sync.sql
```

Створи файл `.env` у корені проєкту. Можна скопіювати `.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rp_role_management
PORT=4000
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:4000/api

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/discord/callback

DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_ROLE_PLAYER=
DISCORD_ROLE_LEADER=
DISCORD_ROLE_ADMIN=
DISCORD_ROLE_WARNING=
DISCORD_ROLE_MUTE=
DISCORD_ROLE_BANNED=
```

## Discord bot sync

Система може автоматично оновлювати ролі на Discord-сервері після зміни ролі на сайті, видачі або скасування покарання, схвалення заявки чи зміни організації.

### Що синхронізується

- `player` → Discord role з `DISCORD_ROLE_PLAYER`
- `leader` → Discord role з `DISCORD_ROLE_LEADER`
- `admin` → Discord role з `DISCORD_ROLE_ADMIN`
- `warning` → Discord role з `DISCORD_ROLE_WARNING`
- `mute` → Discord role з `DISCORD_ROLE_MUTE`
- `ban` → Discord role з `DISCORD_ROLE_BANNED`
- організація → Discord role ID з поля `organizations.discord_role_id`

### Що потрібно в Discord Developer Portal

1. Створити Application і Bot.
2. У вкладці **Bot** увімкнути **Server Members Intent**.
3. У вкладці **OAuth2 → URL Generator** запросити бота на сервер зі scope `bot` і permission **Manage Roles**.
4. Роль бота на Discord-сервері має бути вище ролей, якими бот керує.
5. Скопіювати ID сервера та ID ролей у `.env`.

### Як прив’язується користувач

Користувач натискає в кабінеті вхід через Discord. Після успішного OAuth-входу backend записує Discord ID у поле `users.discord_id`. Після цього сайт знає, якому Discord-акаунту належить користувач, і бот може оновлювати його ролі на сервері.

### Ручна синхронізація

В адмін-панелі доступні кнопки:

- **Синхронізувати обраного з Discord**
- **Синхронізувати всіх з Discord**

Вони викликають backend endpoints:

```http
POST /api/discord/sync/:id
POST /api/discord/sync-all
```

## Запуск проєкту

```bash
npm install
npm run dev
```

Команда запускає одночасно:

- backend API: `http://localhost:4000/api`
- frontend Vite: `http://localhost:5173`

## Тестові акаунти

```text
Player: John_Vancheti / Player123!
Leader: Alex_Moreno / Leader123!
Admin: Henry_Orlov / Admin123!
```

## Важливо

Якщо PostgreSQL або backend ще не запущено, сайт автоматично покаже локальні seed-дані з `src/data/seedData.js`. Для реального додавання, редагування та видалення правил потрібно запустити PostgreSQL і backend.
