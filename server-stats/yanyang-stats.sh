#!/usr/bin/env bash
# 晏阳网站服务器状态采集上报脚本
# 读取主服务器状态 + tmux 会话（MC: server / FRP: frp1、frp2），定时上报到 Cloudflare Worker
# 依赖：bash、curl、awk、sed、date（Arch Linux 基础系统自带）
set -euo pipefail

# 自动加载配置文件（systemd 和手动运行都生效）
if [ -f /etc/yanyang-stats.conf ]; then
  set -a
  . /etc/yanyang-stats.conf
  set +a
fi

STATS_URL="${STATS_URL:-https://backend.www.yanyn.cn/api/server/stats/ingest}"
STATS_TOKEN="${STATS_TOKEN:-}"
INTERVAL="${STATS_INTERVAL:-15}"
CPU_SAMPLE_MS="${CPU_SAMPLE_MS:-800}"
# 格式：显示名|tmux会话名|tmux socket路径(可留空自动探测)，多个用逗号分隔
SERVICES_CFG="${SERVICES_CFG:-Minecraft|server|,FRP Node 1|frp1|,FRP Node 2|frp2|}"

if [ -z "$STATS_TOKEN" ]; then
  echo "[yanyang-stats] 错误：未设置 STATS_TOKEN" >&2
  echo "[yanyang-stats] 请创建 /etc/yanyang-stats.conf 并写入：STATS_TOKEN=你的令牌（与 Cloudflare Worker 的 STATS_INGEST_TOKEN 一致）" >&2
  exit 1
fi

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

collect_cpu_percent() {
  local prev cur
  prev=$(awk '/^cpu / { idle=$5; total=0; for (i=2; i<=8; i++) total+=$i; print idle " " total }' /proc/stat)
  sleep "$(awk -v ms="$CPU_SAMPLE_MS" 'BEGIN { printf "%.2f", ms / 1000 }')"
  cur=$(awk '/^cpu / { idle=$5; total=0; for (i=2; i<=8; i++) total+=$i; print idle " " total }' /proc/stat)
  awk -v p="$prev" -v c="$cur" '
    BEGIN {
      split(p, a, " "); split(c, b, " ")
      idle = b[1] - a[1]; total = b[2] - a[2]
      if (total <= 0) { print 0; exit }
      printf "%.1f", (total - idle) / total * 100
    }'
}

session_running() {
  local session="$1" sock="$2"
  if [ -n "$sock" ]; then
    tmux -S "$sock" has-session -t "$session" 2>/dev/null
    return $?
  fi
  if tmux has-session -t "$session" 2>/dev/null; then
    return 0
  fi
  # 尝试其他用户（root 下遍历 /tmp/tmux-*）的 socket
  local sock_path
  for sock_path in /tmp/tmux-*/*; do
    [ -S "$sock_path" ] || continue
    if tmux -S "$sock_path" has-session -t "$session" 2>/dev/null; then
      return 0
    fi
  done
  return 1
}

build_services_json() {
  local out="" name session sock running
  IFS=',' read -ra entries <<< "$SERVICES_CFG"
  for entry in "${entries[@]}"; do
    [ -z "$entry" ] && continue
    IFS='|' read -r name session sock <<< "$entry"
    if session_running "${session:-}" "${sock:-}"; then
      running="true"
    else
      running="false"
    fi
    if [ -n "$out" ]; then out="$out,"; fi
    out="$out{\"name\":\"$(json_escape "$name")\",\"session\":\"$(json_escape "$session")\",\"running\":$running}"
  done
  printf '%s' "$out"
}

collect() {
  local host platform uptime load1 load5 load15
  local cpu_cores cpu_model cpu_percent
  local mem_total mem_avail mem_used mem_percent
  local disk_total disk_used disk_percent
  local services_json

  host=$(hostname 2>/dev/null || echo unknown)
  platform="$(awk -F= '/^PRETTY_NAME=/ { gsub(/"/, "", $2); print $2 }' /etc/os-release 2>/dev/null || echo Linux) $(uname -r) $(uname -m)"
  uptime=$(awk '{ print int($1) }' /proc/uptime 2>/dev/null || echo 0)
  read -r load1 load5 load15 _ < /proc/loadavg 2>/dev/null || { load1=0; load5=0; load15=0; }

  cpu_cores=$(nproc 2>/dev/null || grep -c '^processor' /proc/cpuinfo || echo 0)
  cpu_model=$(awk -F: '/^model name/ { sub(/^[ \t]+/, "", $2); print $2; exit }' /proc/cpuinfo 2>/dev/null || echo "")
  cpu_percent=$(collect_cpu_percent)

  mem_total=$(awk '/^MemTotal:/ { print $2 * 1024 }' /proc/meminfo 2>/dev/null || echo 0)
  mem_avail=$(awk '/^MemAvailable:/ { print $2 * 1024 }' /proc/meminfo 2>/dev/null || echo 0)
  if [ "$mem_total" -gt 0 ]; then
    mem_used=$((mem_total - mem_avail))
    mem_percent=$(awk -v u="$mem_used" -v t="$mem_total" 'BEGIN { printf "%.1f", u / t * 100 }')
  else
    mem_used=0
    mem_percent=0
  fi

  read -r disk_total disk_used disk_percent < <(df -Pk / 2>/dev/null | awk 'NR==2 { print $2 * 1024, $3 * 1024, $5 }')
  disk_percent=${disk_percent%\%}
  [ -z "${disk_total:-}" ] && disk_total=0
  [ -z "${disk_used:-}" ] && disk_used=0
  [ -z "${disk_percent:-}" ] && disk_percent=0

  services_json=$(build_services_json)

  cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hostname": "$(json_escape "$host")",
  "platform": "$(json_escape "$platform")",
  "uptime": $uptime,
  "load": [$load1, $load5, $load15],
  "cpu": {
    "cores": $cpu_cores,
    "model": "$(json_escape "$cpu_model")",
    "usagePercent": $cpu_percent
  },
  "memory": {
    "total": $mem_total,
    "used": $mem_used,
    "percent": $mem_percent
  },
  "disk": {
    "total": $disk_total,
    "used": $disk_used,
    "percent": $disk_percent
  },
  "services": [$services_json]
}
EOF
}

report() {
  local payload
  payload=$(collect)
  curl -fsS --max-time 20 -X POST "$STATS_URL" \
    -H "Content-Type: application/json" \
    -H "X-Stats-Token: $STATS_TOKEN" \
    -d "$payload" >/dev/null
}

echo "[yanyang-stats] 启动，每 ${INTERVAL}s 上报一次 -> $STATS_URL"
while true; do
  if ! report; then
    echo "[yanyang-stats] $(date '+%F %T') 上报失败，稍后重试" >&2
  fi
  sleep "$INTERVAL"
done
