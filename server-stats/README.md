# 服务器状态采集脚本

在服务器上运行，采集主服务器状态（CPU/内存/硬盘/负载/运行时间）以及 tmux 会话
`server`（MC 服务器）、`frp1`、`frp2`（FRP 节点）的运行状态，定时上报到
Cloudflare Worker，由网页 `/server` 页面展示。

支持 Arch Linux（纯 bash + `/proc` + curl，无发行版特定依赖），使用 systemd 自启动。

## 安装

```bash
sudo cp yanyang-stats.sh /usr/local/bin/yanyang-stats.sh
sudo chmod +x /usr/local/bin/yanyang-stats.sh

sudo cp yanyang-stats.conf.example /etc/yanyang-stats.conf
sudo nano /etc/yanyang-stats.conf   # 修改 STATS_TOKEN，与 Worker 的 STATS_INGEST_TOKEN 一致

sudo cp yanyang-stats.service /etc/systemd/system/yanyang-stats.service
sudo systemctl daemon-reload
sudo systemctl enable --now yanyang-stats
```

## 验证

```bash
systemctl status yanyang-stats
journalctl -u yanyang-stats -f
```

或手动跑一次：

```bash
sudo STATS_TOKEN=你的令牌 bash /usr/local/bin/yanyang-stats.sh
```

## 配置说明

`/etc/yanyang-stats.conf` 中 `SERVICES_CFG` 格式：`显示名|tmux会话名|socket路径`，多个用逗号分隔。
socket 路径留空时脚本会先试当前用户，再遍历 `/tmp/tmux-*/` 下其他用户的 socket，
所以 MC/FRP 跑在哪个用户下都能识别。

若 tmux 会话名不同，修改 `SERVICES_CFG` 即可：

```bash
SERVICES_CFG=Minecraft|server|,FRP Node 1|frp1|,FRP Node 2|frp2|
```
