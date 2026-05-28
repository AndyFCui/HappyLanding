# components/ui

## 模块职责
shadcn/ui 组件库，所有组件均应用微拟物光影质感设计语言。

## 文件清单

| 文件 | 职责 | 状态 |
|------|------|------|
| button.tsx | 按钮，渐变+立体阴影 | 已升级 |
| input.tsx | 输入框，variant: inset/flat | 已升级 |
| card.tsx | 卡片，variant: raised/inset/flat | 已升级 |
| badge.tsx | 标签，渐变背景 | 已升级 |
| label.tsx | 标签文字 | 原生 |
| select.tsx | 下拉选择 | 原生 |
| checkbox.tsx | 复选框 | 原生 |
| switch.tsx | 开关 | 原生 |
| textarea.tsx | 文本域 | 原生 |
| tabs.tsx | 选项卡 | 原生 |
| accordion.tsx | 手风琴 | 原生 |
| dialog.tsx | 对话框 | 原生 |
| alert.tsx | 提示框 | 原生 |
| badge.tsx | 徽章 | 原生 |
| skeleton.tsx | 骨架屏 | 原生 |
| progress.tsx | 进度条 | 原生 |
| avatar.tsx | 头像 | 原生 |
| table.tsx | 表格 | 原生 |
| tooltip.tsx | 工具提示 | 原生 |
| popover.tsx | 弹出框 | 原生 |
| dropdown-menu.tsx | 下拉菜单 | 原生 |
| navigation-menu.tsx | 导航菜单 | 原生 |
| separator.tsx | 分隔线 | 原生 |
| scroll-area.tsx | 滚动区 | 原生 |
| command.tsx | 命令面板 | 原生 |
| hover-card.tsx | 悬停卡片 | 原生 |
| form.tsx | 表单 | 原生 |
| radio-group.tsx | 单选组 | 原生 |
| sheet.tsx | 侧边栏 | 原生 |
| sonner.tsx | 吐司通知 | 原生 |

## 设计规范

### 微拟物光影质感
- 渐变背景：三段式 `linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 85%, black) 50%, color-mix(in srgb, var(--primary) 70%, black) 100%)`
- 立体阴影：外投影 + 顶部高光 + 底部暗边
- Hover 增强：阴影扩大 + 高光增强
- 微交互：hover:scale(1.02) | active:scale(0.97)

### 圆角规范
- sm: 16px | default: 20px | lg: 24px | xl: 32px
- 按钮使用 rounded-2xl (20px)

## 依赖关系
- 依赖 @/lib/utils 的 cn() 函数
- 依赖 class-variance-authority 的 cva()
- 依赖 lucide-react 图标
- 依赖 @radix-ui/* 底层组件