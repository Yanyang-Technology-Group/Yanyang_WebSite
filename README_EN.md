# Official Website of Yanyang Urban Construction 


The official promotional website of Yan Yang City Construction Server, based on Minecraft Fabric 1.20.1, focuses on urban planning and rail transit creation. 


## Technology Stack 


- React 19
- React Router DOM 7
- Vite 7
- TDesign React (Tencent's enterprise-level UI component library)
- TDesign Icons React (Icon library) 


## TDesign Component Usage 


| Component | Usage Scenario | |------|---------|
| HeadMenu / MenuItem | Top Navigation Menu |
| Drawer | Mobile Drawer Navigation |
| Button | Site-wide Button |
| Card | Feature Card, Information Card, Timeline Card |
| Steps / StepItem | Join Process Steps |
| Timeline / TimelineItem | Activity Timeline |
| Tag | Activity Classification Tag |
| Collapse / CollapsePanel | FAQ Collapse Panel |
| Statistic | Data Statistics Display |
| Alert | Home Page Announcement Notification Bar |
| BackTop | Back to Top |
| Tooltip | Hover Tooltip |
| MessagePlugin | Copy Operation Feedback |
| Row / Col | Grid Layout |
| Space / Divider / Link / Image | Auxiliary Layout and Display | 


## Local Development 


```bash
npm install
npm run dev
```




## Deployment Construction 


```bash
npm run build
```




Build the product and output it to the `dist/` directory. 


## Page Structure 


- **Home** - Brand display area, core feature cards, announcement and notice bar
- **Events** - Server historical activities and version update timeline
- **Join** - In-game process steps, server configuration information, FAQ collapsible panel
- **About** - Community introduction, data statistics, partner display 


## Features 


- Brand color synchronization with TDesign CSS Token, unified component color matching
- IntersectionObserver scroll-in animation
- QQ group number / email click-to-copy + message feedback
- Gradient title area for sub-pages
- Responsive design (desktop + mobile)
- 404 page Minecraft theme animation 


## Link 


- Official website: https://www.yanyn.cn
- Rail Transit System: https://rail.yanyn.cn
- QQ Group: 486029013
- Feedback Email: feedback@yanyn.cn
