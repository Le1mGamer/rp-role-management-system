CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(64) UNIQUE NOT NULL,
  password VARCHAR(128) NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('player', 'leader', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'inactive')),
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL,
  rating NUMERIC(3,1) DEFAULT 0,
  created_at DATE DEFAULT CURRENT_DATE,
  members INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  reputation INTEGER DEFAULT 0,
  organization_id INTEGER REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  access_level INTEGER NOT NULL DEFAULT 1,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  super_admin BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS leaders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  rank VARCHAR(64) NOT NULL,
  members_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rules (
  id SERIAL PRIMARY KEY,
  category VARCHAR(128) NOT NULL,
  title VARCHAR(128) NOT NULL,
  text TEXT NOT NULL,
  access VARCHAR(20) NOT NULL CHECK (access IN ('all', 'player', 'leader', 'admin')),
  updated_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  applicant_id INTEGER NOT NULL REFERENCES users(id),
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  type VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS punishments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(64) NOT NULL,
  reason TEXT NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
