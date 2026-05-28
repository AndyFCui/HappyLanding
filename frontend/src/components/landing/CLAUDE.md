# components/landing

## 模块职责
Landing Page 专用组件，包含所有落地页 Section。

## 文件清单

| 文件 | 职责 | 状态 |
|------|------|------|
| Hero.jsx | 首屏区域，含标题/CTA/社会证明 | 已完成 |
| LogoBar.jsx | 客户/合作伙伴 Logo 展示 | 已完成 |
| ProblemSection.jsx | 痛点问题展示 | 已完成 |
| FeaturesSection.jsx | 功能特性（Bento Grid） | 已完成 |
| HowItWorks.jsx | 使用步骤 | 已完成 |
| Testimonials.jsx | 用户评价 | 已完成 |
| Pricing.jsx | 定价方案 | 已完成 |
| FAQ.jsx | 常见问题 | 已完成 |
| FinalCTA.jsx | 最终行动号召 | 已完成 |
| Footer.jsx | 底部导航 | 已完成 |

## 依赖关系
- 依赖 framer-motion 动画
- 依赖 shadcn/ui 组件（Button, Card, Badge 等）
- 依赖 @/lib/motion 动画预设

## 设计规范
- 全部使用 CSS 变量颜色（hsl(var(--primary)) 等）
- 禁止硬编码颜色
- 动效使用 Framer Motion + viewport trigger