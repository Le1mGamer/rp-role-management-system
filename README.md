# RP Role Management System

Курсовий проєкт з дисципліни «Проєктування інформаційних систем».

## Тема

Інформаційна система управління ролями, правилами та заявками для мультиплеєрних рольових серверів.

## Поточна реалізація

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Мова інтерфейсу: UA / ENG
- Авторизація: nickname + password
- Рольовий доступ: player, leader, admin
- CRUD для правил: адміністратор може додавати, редагувати та видаляти правила через сайт
- Форми дій: розгляд заявок лідером/адміністратором, видача покарання адміністратором

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

Створи файл `.env` у корені проєкту:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rp_role_management
PORT=4000
VITE_API_URL=http://localhost:4000/api
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
