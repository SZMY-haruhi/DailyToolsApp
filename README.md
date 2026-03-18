<div align="center">

# 📋 DailyToolsApp

**一款简洁优雅的日常工具应用**

![GitHub repo size](https://img.shields.io/github/repo-size/SZMY-haruhi/DailyToolsApp)
![GitHub last commit](https://img.shields.io/github/last-commit/SZMY-haruhi/DailyToolsApp)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue)

</div>

---

## ✨ 功能特性

### � 待办事项管理

| 功能 | 描述 |
|------|------|
| 任务创建 | 毛玻璃抽屉式添加任务，支持备注和提醒时间 |
| 拖拽关闭 | 手势拖拽抽屉关闭，流畅自然 |
| 响应式布局 | 自动适配不同屏幕尺寸 |
| 深色模式 | 跟随系统自动切换明暗主题 |

### 🎨 设计亮点

- **毛玻璃效果** - 使用 `expo-blur` 实现现代化 UI
- **流畅动画** - 弹性动画 + 淡入淡出过渡
- **手势交互** - PanResponder 实现拖拽手势
- **自适应布局** - 小屏到大屏完美适配

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React Native | 0.81.5 | 跨平台移动端框架 |
| Expo | 54.0.33 | 开发与打包工具 |
| TypeScript | 5.9.2 | 类型安全 |
| Expo Router | 6.0.23 | 文件系统路由 |
| expo-blur | - | 毛玻璃效果 |
| AsyncStorage | 3.0.1 | 本地数据持久化 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Expo CLI

### 安装运行

```bash
# 克隆项目
git clone https://github.com/SZMY-haruhi/DailyToolsApp.git

# 进入目录
cd DailyToolsApp

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 预览方式

- **手机预览**: 下载 [Expo Go](https://expo.dev/go)，扫描二维码
- **Web 预览**: 按 `w` 键在浏览器中打开
- **模拟器**: 按 `i` (iOS) 或 `a` (Android)

---

## 📁 项目结构

```
DailyToolsApp/
├── app/                      # 页面文件 (Expo Router)
│   ├── (tabs)/               # 底部导航页面
│   │   ├── index.tsx         # 待办事项主页
│   │   ├── explore.tsx       # 探索页
│   │   └── profile.tsx       # 个人资料
│   └── _layout.tsx           # 根布局
├── components/               # 公共组件
│   ├── add-task-drawer.tsx   # 任务添加抽屉
│   └── messages-drawer.tsx   # 消息抽屉
├── hooks/                    # 自定义 Hooks
│   ├── use-responsive.ts     # 响应式工具函数
│   └── use-color-scheme.ts   # 主题切换
├── constants/                # 常量配置
│   └── theme.ts              # 主题颜色配置
└── assets/                   # 静态资源
```

---

## 🎯 开发计划

- [x] 待办事项基础功能
- [x] 毛玻璃抽屉组件
- [x] 拖拽手势关闭
- [x] 响应式布局
- [ ] 任务分类标签
- [ ] 数据云同步
- [ ] 小组件支持
- [ ] 通知提醒

---

## 📸 应用截图

> 敬请期待...

---

## 👨‍💻 开发者

**SZMY-haruhi**

正在学习 React Native 开发中 🌱

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star ⭐**

</div>
