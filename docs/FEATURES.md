# HappyLanding 功能说明

## 概述

HappyLanding 是基于 AWS 的企业级知识管理平台，支持统一搜索、AI 对话、知识图谱可视化。

---

## 控制台 (Dashboard)

入口：`/` 或 `/dashboard`

**功能**：
- 系统信息卡片：版本、运行环境、数据库、AI 模型
- 服务入口：搜索、AI 对话、知识图谱、文档管理
- 快速操作：设计系统、服务状态、关于

**设计**：
- 渐变背景 + 3D 阴影的微拟物风格
- 卡片 hover 发光效果
- 实时时钟显示

---

## 搜索服务

入口：`/search`

**功能**：
- 全文 + 向量混合搜索
- 支持自然语言查询
- 实时搜索建议

**技术实现**：
- 后端调用 OpenSearch
- 支持多语言分词
- 语义相似度排序

---

## AI 对话

入口：`/chat`

**功能**：
- 多轮对话支持
- 上下文理解
- 调用 AWS Bedrock Claude 3

**技术实现**：
- Session-based 会话管理
- 流式响应（Streaming）
- 支持文件上传

---

## 知识图谱

入口：`/graph`

**功能**：
- 实体可视化
- 关系探索
- 图查询

**技术实现**：
- 基于 Amazon Neptune 图数据库
- 支持 Gremlin 查询语言
- 动态布局算法

---

## 文档管理

入口：`/documents`

**功能**：
- 文档列表查看
- 多格式支持（PDF、Word、TXT）
- 文档解析与索引

**技术实现**：
- 文件存储在 S3
- 元数据管理
- 版本控制

---

## 服务状态

入口：`/services`

**功能**：
- 各服务健康状态
- 依赖关系展示
- 告警历史

---

## 监控面板

入口：`/monitoring`

**功能**：
- Grafana 仪表盘入口
- Alertmanager 告警入口
- 集群指标查看

**访问方式**：点击卡片 → 新标签页打开外部系统

---

## 设计系统

入口：`/design-system`

**功能**：
- 组件展示（Button、Card、Input、Badge）
- 变体演示（raised、inset、flat）
- 配色方案
- 交互效果

**组件列表**：

| 组件 | 变体 | 说明 |
|------|------|------|
| Button | raised、glass | 支持 8 种状态 |
| Card | raised、inset、flat | 支持 hover 发光 |
| Input | inset、flat | 带 focus 阴影 |
| Badge | gradient | 渐变背景 |

---

## 页面导航

| 路径 | 页面 | 侧边栏入口 |
|------|------|-----------|
| `/` | 控制台 | ✓ |
| `/search` | 搜索服务 | ✓ |
| `/chat` | AI 对话 | ✓ |
| `/graph` | 知识图谱 | ✓ |
| `/documents` | 文档管理 | ✓ |
| `/services` | 服务状态 | ✓ (底部) |
| `/monitoring` | 监控面板 | ✓ (底部) |
| `/about` | 关于 | ✓ (底部) |
| `/design-system` | 设计系统 | 快速操作入口 |

---

## 技术亮点

### 微拟物光影设计
- 渐变背景：`bg-gradient-to-br from-primary/20 to-accent/20`
- 立体阴影：`shadow-[0_8px_32px_rgba(0,0,0,0.12)]`
- 玻璃拟态：`backdrop-blur-lg bg-white/80`

### 响应式布局
- 移动端：单列布局
- 平板：双列网格
- 桌面：四列网格

### 状态管理
- React Router 导航
- Zustand 状态（如需要）
- React Query 数据获取

### 组件变体系统
```jsx
// Button 示例
<Button variant="raised">Raised</Button>
<Button variant="glass">Glass</Button>

// Card 示例
<Card variant="raised">3D 阴影</Card>
<Card variant="inset">内凹效果</Card>
<Card variant="flat">扁平风格</Card>
```