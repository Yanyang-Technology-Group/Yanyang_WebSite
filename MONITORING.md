# 监控数据页部署

数据页使用 Tremor 图表，物理服务器可独立展开/收起；默认只展开第一台。`yanyn.cn CDN` 排在物理服务器之后，Cloudflare 服务状态固定在最后。

## D1 初始化

在后端目录执行一次增量迁移，再部署 Worker：

```sh
npx wrangler d1 execute yanyangweb --remote --file=migrations/0002_monitoring.sql
npm run deploy
```

新数据库也可执行完整 `schema.sql`。迁移只创建新表，不修改已有上报数据。未迁移时，实时上报仍可使用，历史与云数据接口会提示不可用。

## Cloudflare Token

创建一个自定义 API Token，权限仅设为 **Zone / Analytics / Read**，资源仅选 **Specific zone / yanyn.cn**。不要使用 Global API Key，也不需要账户管理、DNS 修改、Zone 编辑等权限。

在 Worker 的 Settings → Variables and Secrets 中配置：

| 名称 | 类型 | 内容 |
| --- | --- | --- |
| `CF_ANALYTICS_TOKEN` | Secret（加密） | 上述仅允许读取 yanyn.cn 分析的 Token |
| `CF_ZONE_ID` | Variable 或 Secret | yanyn.cn 的 Zone ID |

也可使用 `npx wrangler secret put CF_ANALYTICS_TOKEN` 交互输入。Token 不应写入 `wrangler.toml`、Git、前端 `.env`、`VITE_*` 变量或任何浏览器代码。提供的控制台链接中的 `7e07e876d2a2c5658da40d547a577510` 是 Account ID，不能直接当作 Zone ID；Zone ID 在域名概览页的 API 区域查看。

浏览器只会读取以下固定接口：

- `GET /api/server/stats`：实时上报和最近 60 分钟的指标、服务状态历史。
- `GET /api/cloudflare/analytics?range=24h`：CDN 汇总、小时趋势和七类热门排行。仅允许 `1h`、`6h`、`12h`、`24h`、`7d`、`30d`。
- `GET /api/cloudflare/status`：Cloudflare 全部服务分组、当前状态和官方 90 天事件历史。

CDN 接口只使用服务端设定的 Zone ID、GraphQL 查询和时间范围，不接受调用者提供的 URL、账户、Zone、Token 或任意 GraphQL。返回字段为汇总数值和排行名称；不返回 Token、授权头、Zone ID 或上游原始错误，也不记录这些内容。查询禁止跟随跳转。公开访客可以读取页面展示的汇总统计，但不能通过此接口调用其他 Cloudflare API。

## 刷新与存储上限

- 物理服务器和服务状态：前端每 **1 秒**请求。采集客户端自身的上报周期仍由各服务器配置，页面刷新不会改变采集周期。
- CDN、Cloudflare：前端每 **30 秒**请求，收起区块也继续刷新；Worker 共享 D1 缓存约 30 秒，查询失败保留最近成功数据并退避重试。
- `server_monitor_history`：每台服务器仅一行 JSON，包含最近 **60 分钟**的数据；指标每分钟一个点，服务每分钟保留最严重状态，最多 100 个服务。多数上报只读历史，只有新分钟或状态变差才覆盖写入。无采样的分钟显示灰色，历史不会被伪造为正常。
- `monitoring_cache`：通常为 6 个 CDN 时间范围、1 个 Cloudflare 状态文档、1 个额度计数器，均覆盖写入。切换配置中的 Zone ID 会产生该新 Zone 的缓存键。
- 物理服务器历史超过一小时的样本会裁剪；已停止上报的历史行会在后续采集上报时清理。已有服务器最新数据仍按服务器 ID 单行保存，7 天未上报的服务器不再列出。
- D1 的刷新租约防止不同 Worker 实例重复请求 Cloudflare；所有 CDN 范围共用每 5 分钟最多 24 次刷新预算，每次最多 9 个固定只读查询。达到额度时保留缓存，避免公开接口被用于无限消耗 Token 的 API 配额。首次查询失败时只保存预设的错误代码，在重试等待期间保留具体诊断；不存储上游错误正文或凭据。

CDN 的历史范围和部分分析维度取决于 Cloudflare 套餐及数据保留期；不支持的范围会提示不可用，不生成演示数据。`visits` 使用 Cloudflare 的访问口径，不是独立访客数；GraphQL Adaptive 数据可能是采样估算。缓存命中率按缓存请求数 / 请求总数计算，包含 hit、stale、updating、revalidated。

缓存状态维度单独查询；该维度受限不会使请求数、传输量、访问量及其他排行一起失败，命中率显示 `--`。查询的时间条件使用官方文档中的 `Time` 变量和内联过滤器，避免依赖特定版本生成的过滤器类型名称。

## CDN 排错

页面和接口只返回以下预设诊断，不返回 Cloudflare 原始错误。无需把 Token 发给任何人。

| 接口代码 | 检查事项 |
| --- | --- |
| `analytics_not_configured` | 检查变量名、Token 是否已设置、Zone ID 是否为 32 位十六进制 |
| `analytics_auth_error` | Token 已失效、填写错误或身份验证失败 |
| `analytics_forbidden` | Token 是否有 yanyn.cn 的 Analytics 读取权限；资源必须包含该 Zone |
| `analytics_zone_unavailable` | Zone ID 是否填错，Token 是否授权了该域名 |
| `analytics_query_error` | 后端查询字段或类型与 Cloudflare schema 不兼容，应修正查询 |
| `analytics_range_unavailable` | 查询时段、保留期或所需字段受限，可先试过去 1 小时 |
| `analytics_rate_limited` / `analytics_busy` | 等待限流或共享刷新额度恢复，系统会自动重试 |
| `analytics_storage_unavailable` | 检查 DB 绑定以及 `monitoring_cache` 表是否已迁移 |
| `analytics_unavailable` | 网络、超时或其他未分类的上游故障 |

更新前后端即可启用这些诊断，不需要新增数据库迁移。更新后读取 `/api/cloudflare/analytics?range=1h` 的 `code` 可继续定位；重试等待最长约一分钟。

Cloudflare 服务区块不使用 iframe，前端内置完整快照作为首次加载和接口故障时的兜底，并显示采集时间；Worker 每约 30 秒从官网读取结构化服务数据并覆盖存入 D1。若官网更改格式，保留最后成功快照。前端目录可执行 `npm run snapshot:cloudflare` 更新内置快照。

## 检查

```sh
# 后端：Node.js 22.13+（测试使用内置 SQLite）
npm run build
npm test

# 前端目录
npm run typecheck
npm run build
```

自动化测试验证历史裁剪和并发覆盖、真实 SQLite 上的 D1 缓存租约、30 秒刷新边界、六种时间范围、API 参数限制、凭据不泄露、配额退避、维度受限时的降级，以及官网结构化数据解析。未配置真实 Token 时，CDN 只能验证接口逻辑和本地界面，不能验证当前账号的套餐权限或实际统计。
