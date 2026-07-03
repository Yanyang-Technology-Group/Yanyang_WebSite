<div align="center">
  <img src="https://github.com/Yanyang-Technology-Group/Yanyang_WebSite/blob/main/public/images/logo.png?raw=true" alt="晏阳城市建设 Logo" width="160">
  <h1>晏阳城市建设官网</h1>
  <p>基于 Minecraft Fabric 1.20.1 服务器的官方形象网站 | 专注城市规划与轨道交通创作</p>
  <p>
    <a href="https://www.yanyn.cn" target="_blank">
      <img src="https://img.shields.io/badge/在线访问-www.yanyn.cn-3B82F6?style=for-the-badge&logo=google-chrome&logoColor=white" alt="官网">
    </a>
    <a href="https://rail.yanyn.cn" target="_blank">
      <img src="https://img.shields.io/badge/轨道交通-rail.yanyn.cn-00C7B7?style=for-the-badge&logo=minecraft&logoColor=white" alt="轨道交通">
    </a>
  </p>
  <p>
    <img src="https://img.shields.io/github/stars/Yanyang-Technology-Group/Yanyang_WebSite?style=social" alt="GitHub stars">
    <img src="https://img.shields.io/github/license/Yanyang-Technology-Group/Yanyang_WebSite" alt="License">
    <img src="https://img.shields.io/github/last-commit/Yanyang-Technology-Group/Yanyang_WebSite" alt="Last commit">
  </p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19"> 
    <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite" alt="Vite 7"> 
    <img src="https://img.shields.io/badge/React_Router-v7-CA4245?logo=reactrouter" alt="React Router v7"> 
    <img src="https://img.shields.io/badge/CSS-Tailwind_v4-06B6D4?logo=tailwindcss" alt="Tailwind CSS v4"> 
    <img src="https://img.shields.io/badge/Icons-Phosphor-3B82F6" alt="Phosphor Icons">
  </p>
</div>

---

## 特性

- **Flat Design** — 零阴影、色彩分块、纯色交替背景
- **Phosphor Icons** — 统一矢量图标系统，tree-shakable
- **Tailwind CSS v4** — 原子化 CSS，按需构建，设计 Token 驱动
- **滚动入场动画** — IntersectionObserver 驱动渐入效果
- **骨架屏加载** — 线路图 iframe 加载态
- **完全响应式** — 适配 375px ~ 1440px
- **品牌主题 404** — 简洁克制的错误页面

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 19 |
| 构建 | Vite 7 |
| 路由 | React Router v7 |
| 样式 | Tailwind CSS v4 |
| 图标 | Phosphor Icons |
| 字体 | Inter + Noto Sans SC |

## 项目结构

```
src/
├── components/          # 共享组件
│   ├── Navbar.jsx       # 顶部导航
│   ├── Footer.jsx       # 全局页脚
│   ├── ScrollReveal.jsx # 滚动渐入
│   └── Skeleton.jsx     # 骨架屏
├── pages/               # 页面组件
│   ├── Home.jsx         # 首页
│   ├── About.jsx        # 关于
│   ├── Join.jsx         # 加入
│   ├── Event.jsx        # 活动
│   └── Map.jsx          # 线路图
├── Events/              # 活动详情页
│   └── 4years.jsx       # 4 周年庆典
├── App.jsx              # 路由 + 布局
├── index.css            # Tailwind + 设计 Token
└── main.jsx             # 入口
```

## 页面

| 页面 | 内容 |
|---|---|
| **首页** | Hero、4 周年广告横幅、特性卡片、社群数据、CTA |
| **活动** | 活动卡片列表 |
| **加入** | 三步引导、服务器/硬件信息、FAQ 折叠面板 |
| **关于** | 社群故事、轨交数据、合作伙伴轮播 |
| **线路图** | 全宽 iframe 嵌入在线地图 |

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 用户构建（含版本号注入）
npm run build:user
```

## 许可证

GNU GPL v3
