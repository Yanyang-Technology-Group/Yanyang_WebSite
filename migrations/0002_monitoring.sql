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
