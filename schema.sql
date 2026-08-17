-- 晏阳后端 D1 数据库表结构
-- 执行方式：
--   wrangler d1 execute yanyang-stats --remote --file schema.sql

CREATE TABLE IF NOT EXISTS server_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS used_tokens (
  token TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bans (
  ip TEXT PRIMARY KEY,
  ban_time INTEGER NOT NULL,
  reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_rate (
  email TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL,
  last_send_at INTEGER
);
