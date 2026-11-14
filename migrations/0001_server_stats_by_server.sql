CREATE TABLE IF NOT EXISTS server_stats_by_server (
  server_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_server_stats_by_server_updated_at
  ON server_stats_by_server (updated_at DESC);

INSERT OR IGNORE INTO server_stats_by_server (server_id, data, updated_at)
SELECT servers.key, servers.value, server_stats.updated_at
FROM server_stats,
  json_each(
    CASE WHEN json_valid(server_stats.data) THEN server_stats.data ELSE '{}' END,
    '$.servers'
  ) AS servers
WHERE json_type(
  CASE WHEN json_valid(server_stats.data) THEN server_stats.data ELSE '{}' END,
  '$.servers'
) = 'object';

INSERT OR IGNORE INTO server_stats_by_server (server_id, data, updated_at)
SELECT
  'legacy',
  json_object(
    'serverId', 'legacy',
    'displayName', '主服务器',
    'intervalSeconds', 5,
    'receivedAt', server_stats.updated_at,
    'metrics', json(server_stats.data)
  ),
  server_stats.updated_at
FROM server_stats
WHERE json_valid(server_stats.data)
  AND json_type(server_stats.data, '$.hostname') = 'text'
  AND json_type(server_stats.data, '$.servers') IS NULL;
