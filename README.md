[English Version](README_EN.md)

# 晏阳城市建设 官方网站


晏阳城市建设服务器的官方宣传网站，基于 Minecraft Fabric 1.20.1，专注城市规划与轨道交通创作。


## 技术栈
<img align="center" src="https://img.shields.io/badge/React-19-green"/> <img align="center" src="https://img.shields.io/badge/React Router DOM-7-red"/> <img align="center" src="https://img.shields.io/badge/Vite-7-blue"/> <img align="center" src="https://img.shields.io/badge/UI-TDesign React-gold"/> <img align="center" src="https://img.shields.io/badge/Icons-TDesign Icons React-pink"/>


## TDesign 组件使用


| 组件 | 使用场景 |
|------|---------|
| HeadMenu / MenuItem | 顶部导航栏 |
| Drawer | 移动端抽屉导航 |
| Button | 全站按钮 |
| Card | 特性卡片、信息卡片、时间线卡片 |
| Steps / StepItem | 加入流程步骤 |
| Timeline / TimelineItem | 活动时间线 |
| Tag | 活动分类标签 |
| Collapse / CollapsePanel | FAQ 折叠面板 |
| Statistic | 数据统计展示 |
| Alert | 首页公告通知栏 |
| BackTop | 回到顶部 |
| Tooltip | 悬停提示 |
| MessagePlugin | 复制操作反馈 |
| Row / Col | 栅格布局 |
| Space / Divider / Link / Image | 辅助布局与展示 |


## 本地开发


```bash
npm install
npm run dev
```


## 构建部署


```bash
npm run build
```


构建产物输出至 `dist/` 目录。


## 页面结构


- **首页** - 品牌展示区、核心特色卡片、公告通知栏
- **活动** - 服务器历史动态与版本更新时间线
- **加入** - 入服流程步骤、服务器配置信息、FAQ 折叠面板
- **关于** - 社群介绍、数据统计、合作伙伴展示


## 特性


- 品牌色同步至 TDesign CSS Token，组件配色统一
- IntersectionObserver 滚动入场动画
- QQ 群号 / 邮箱点击复制 + 消息反馈
- 子页面渐变标题区
- 响应式设计（桌面端 + 移动端）
- 404 页面 Minecraft 主题动画


## 链接


- 官网: https://www.yanyn.cn
- 轨道交通系统: https://rail.yanyn.cn
- QQ群: 486029013
- 反馈邮箱: feedback@yanyn.cn
