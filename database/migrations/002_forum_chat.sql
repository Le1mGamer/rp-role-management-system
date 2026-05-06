CREATE TABLE IF NOT EXISTS forum_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

SELECT setval('forum_messages_id_seq', COALESCE((SELECT MAX(id) FROM forum_messages), 1), true);
