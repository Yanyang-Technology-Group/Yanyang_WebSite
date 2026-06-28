# 晏阳城建官网重设计 — 设计规格

## 概述

彻底重写现有官网，从 TDesign + 单文件 CSS 架构迁移到 Tailwind CSS + 手写组件架构。消除 AI 感，建立统一、克制的品牌视觉语言。

参考品牌：Linear、Stripe、Vercel、Railway。

---

## 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | React 19 + Vite 7 | 复用现有 |
| 路由 | React Router v7 | 复用现有 |
| 样式 | Tailwind CSS v4 | 原子化，无冲突 |
| 图标 | `@phosphor-icons/react` | 统一风格，tree-shakable |
| 字体 | Inter（Google Fonts） | 替代 Noto Sans SC，中英文兼容 |

---

## 文件结构

```
src/
├── main.jsx              # 入口
├── App.jsx               # 路由定义 + 布局
├── index.css             # Tailwind 指令 + CSS 变量
├── components/
│   ├── Navbar.jsx        # 固定顶部导航
│   ├── Footer.jsx        # 全局页脚
│   ├── ScrollReveal.jsx  # 滚动渐入 Hook
│   └── Skeleton.jsx      # 骨架屏加载态
├── pages/
│   ├── Home.jsx          # 首页：Hero → 亮点 → 数据 → CTA
│   ├── About.jsx         # 关于：故事 → 轨道交通 → 合作伙伴
│   ├── Join.jsx          # 加入：步骤引导 → 服务器信息 → FAQ
│   ├── Event.jsx         # 活动：时间轴
│   └── Map.jsx           # 地图：全宽 iframe 嵌入
└── assets/               # 静态资源（图片、logo）
```

---

## 页面架构

### 首页 (`/`)

四段式 Community Landing 结构：

1. **Hero** — 品牌蓝背景 `#3B82F6`，白字大标题 + 一句话介绍 + CTA + 三组关键数字
2. **亮点卡片** — `#F3F4F6` 灰底，三列卡片（城市建造 / 轨道交通 / 公益运营），图标放在纯色方块内
3. **社群数据** — 白底，大字数据展示（100+ 活跃玩家 / 4 年运营 / 7 座换乘站）
4. **底部 CTA** — 灰底，橙色 `#EA580C` 按钮，"立即加入"

### 关于页 (`/about`)

交替分块结构：

1. **我们的故事** — 白底，图片 + 文字左右排布
2. **轨道交通** — 蓝底 `#3B82F6`，数据亮点，突出 19 条线路 / 7 座换乘站
3. **合作伙伴** — 灰底 `#F3F4F6`，Logo 轮播（简化现有轮播，纯 CSS 或最小化 JS）

### 加入页 (`/join`)

信息型单页：

1. **步骤引导** — 三步卡片流（加入 QQ → 安装客户端 → 开始建造），第一步高亮蓝底
2. **服务器信息** — 灰底，4 列网格展示版本/核心/模组/内存
3. **FAQ** — 手风琴折叠面板，灰色分割线分隔

### 活动页 (`/event`)

时间轴布局：

1. 左侧蓝色竖线，条目按时间排序
2. 最新活动高亮，历史活动灰度递减
3. 点击跳转活动详情页（`/events/:id`）

### 地图页 (`/map`)

嵌入式：

1. 移除现有紫色渐变主题
2. 全宽 iframe 嵌入 `umap.yanyn.cn`
3. 加载态显示骨架屏

---

## 设计系统（ui-ux-pro-max 生成）

### 色彩

| 角色 | 值 | CSS 变量 |
|---|---|---|
| 主色 | `#3B82F6` | `--color-primary` |
| 辅色 | `#10B981` | `--color-secondary` |
| CTA | `#EA580C` | `--color-accent` |
| 背景 | `#FFFFFF` | `--color-bg` |
| 表面 | `#F3F4F6` | `--color-surface` |
| 前景 | `#111827` | `--color-fg` |
| 弱化 | `#6B7280` | `--color-muted` |
| 边框 | `#E5E7EB` | `--color-border` |

### 字体

| 用途 | 规格 |
|---|---|
| 大标题 | Inter, 800 weight, 40px+, letter-spacing: -0.5px |
| 副标题 | Inter, 600 weight, 16-28px |
| 正文 | Inter, 400 weight, 16px, line-height: 1.625 |
| 辅助/Caption | Inter, 400 weight, 13-14px, color: muted |

### 间距

4dp 基准网格：`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`

- Section 间距：64px
- 卡片内边距：24-32px
- 内容最大宽度：`max-w-5xl`（约 1024px）
- 文字段落最大宽度：`max-w-3xl`（约 768px）

### 效果

- **零阴影**（`shadow: none`，`elevation: 0`）
- 圆角：6px（卡片）、8px（按钮）、12px（大容器）
- 无渐变背景
- 点击反馈：`active:scale-[0.97]`，过渡 150ms
- 滚动渐入：IntersectionObserver + `opacity` + `translateY`，200-300ms
- 加载态：Tailwind `animate-pulse` 骨架屏

---

## 设计原则

### 必须遵循

1. **Flat Design + Swiss Grid**：色彩分块区分 Section（非边框/阴影），12 列网格，数学比例留白
2. **图标**：Phosphor Icons 统一风格，放在纯色方块容器中（`bg-blue-100` + `text-blue-600`）
3. **无装饰动画**：不飘动、不脉冲、不弹跳。仅保留滚动渐入和按钮按下反馈
4. **数字格式化**：100+（而非 100），无长数字字符串
5. **Section 交替背景**：白 → 灰 → 白 → 灰，纯色块切换
6. **单一强调色**：CTA 按钮用橙色 `#EA580C`，其余不变

### 禁止

- ❌ 阴影、3D 效果、渐变背景
- ❌ 浮窗弹出广告
- ❌ 飘动/脉冲/弹跳等装饰动画
- ❌ 仅颜色传达信息（需配合文字或图标）
- ❌ emoji 作为导航或系统图标（可用在内容区点缀）
- ❌ `!important` 覆盖样式
- ❌ 单文件 CSS 架构
- ❌ 硬编码的无意义动画

---

## 迁移策略

1. 初始化 Tailwind CSS v4 到 Vite 项目
2. 创建 `index.css`（Tailwind 指令 + CSS 自定义属性）
3. 先建 `components/`（Navbar、Footer、ScrollReveal、Skeleton）
4. 逐页重写 `pages/`，每页独立样式
5. 移除 `tdesign-react`、`tdesign-icons-react` 依赖
6. 删除旧 `style.css`、旧页面组件
7. 验证所有路由正常工作

---

## 验收标准

- [ ] 5 个页面在 375px / 768px / 1024px / 1440px 下正常显示
- [ ] 零阴影、无渐变、无装饰动画
- [ ] 所有图标来自 Phosphor Icons
- [ ] 文字对比度 ≥ 4.5:1（正文）/ 3:1（辅助）
- [ ] 按钮有按下反馈动画
- [ ] 加载态有骨架屏
- [ ] 无 `!important`
- [ ] 无 TDesign 依赖残留
- [ ] 地图页 iframe 正常加载
