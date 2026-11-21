-- 晏阳后端 D1 数据库表结构
-- 执行方式：
--   wrangler d1 execute yanyangweb --remote --file schema.sql

CREATE TABLE IF NOT EXISTS server_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS server_stats_by_server (
  server_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_server_stats_by_server_updated_at
  ON server_stats_by_server (updated_at DESC);

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
-- One bounded history document per server, not one row per sample.
CREATE TABLE IF NOT EXISTS server_monitor_history (
  server_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_server_monitor_history_updated_at ON server_monitor_history(updated_at);

-- Six CDN ranges, one Cloudflare status document, and a small API budget counter.
CREATE TABLE IF NOT EXISTS monitoring_cache (
  cache_key TEXT PRIMARY KEY,
  data TEXT,
  updated_at INTEGER NOT NULL DEFAULT 0,
  refresh_after INTEGER NOT NULL DEFAULT 0
);
