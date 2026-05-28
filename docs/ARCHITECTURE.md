# HappyLanding 系统架构

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + Vite + Tailwind CSS v4 + shadcn/ui | 用户界面 |
| 后端 | FastAPI (Python 3.11) | API 服务 |
| 搜索 | Amazon OpenSearch | 全文 + 向量搜索 |
| 图数据库 | Amazon Neptune | 知识图谱存储 |
| AI | AWS Bedrock (Claude 3) | 大语言模型 |
| 容器编排 | AWS EKS (Kubernetes 1.29) | 生产环境部署 |
| 监控 | Prometheus + Grafana + Alertmanager | 指标与告警 |
| 基础设施 | Terraform | IaC 声明式管理 |

---

## 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS EKS Cluster                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Frontend  │    │   FastAPI   │    │ Prometheus  │    │
│  │   (React)   │    │   Backend   │    │ + Grafana   │    │
│  │  Port:3000 │    │  Port:8080  │    │  Monitoring │    │
│  └─────────────┘    └──────┬──────┘    └─────────────┘    │
│                            │                                │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │ OpenSearch  │    │  Neptune   │    │     S3      │   │
│  │  (Search)   │    │  (Graph)   │    │  (Files)    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                             │
│         ┌──────────────────┐                                │
│         ▼                  ▼                                │
│  ┌─────────────┐    ┌─────────────┐                        │
│  │   Bedrock   │    │   Cognito   │                        │
│  │(Claude LLM) │    │   (Auth)    │                        │
│  └─────────────┘    └─────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 网络拓扑

```
Internet
    │
    ▼
┌─────────────────┐
│   Nginx Ingress │ (TLS termination, routing)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Frontend│ │Backend │
│:3000   │ │:8080  │
└────────┘ └────────┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │ EKS VPC  │
    │ 10.0.0.0/16
    ├─────────┤
    │Pub Subnet│ (Public ELB)
    │10.0.1.0/24│
    │10.0.2.0/24│
    ├─────────┤
    │Priv Subnet│ (Nodes + Pods)
    │10.0.10.0/24│
    │10.0.11.0/24│
    └──────────┘
```

---

## 前端模块

**目录结构**：
```
frontend/src/
├── components/
│   ├── layout/     # AppLayout, Sidebar
│   ├── landing/    # Hero, Features 等落地页
│   └── ui/         # shadcn/ui 组件 (Button, Card, Input, Badge)
├── pages/
│   ├── Dashboard/   # 控制台主页
│   ├── Search/      # 搜索页
│   ├── Chat/        # AI 对话页
│   ├── Graph/       # 知识图谱页
│   ├── Documents/   # 文档管理页
│   ├── DesignSystem/# 设计系统展示
│   └── Monitoring/ # 监控入口 (Grafana/Alertmanager)
└── lib/
    ├── utils.ts     # cn() 工具函数
    └── motion.js    # Framer Motion 动画预设
```

---

## 后端模块

**目录结构**：
```
backend/fastapi/
├── main.py          # FastAPI 主入口，所有路由
└── requirements.txt # 依赖
```

**API 路由**：
| 路径 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/health/ready` | GET | 就绪检查 |
| `/v1/search` | POST | 搜索接口 |
| `/v1/chat/sessions/{id}/messages` | POST | AI 对话 |
| `/v1/graph/entities` | POST | 创建实体 |
| `/v1/graph/entities/{id}` | GET | 获取实体 |
| `/v1/documents` | GET | 文档列表 |

---

## 基础设施

**Terraform 结构**：
```
infrastructure/terraform/
├── eks.tf          # VPC、子网、NAT Gateway、EKS 集群、节点组、IAM
├── variables.tf    # 输入变量（CIDR、实例类型、副本数等）
└── outputs.tf      # 输出（集群 endpoint、kubectl 配置命令）
```

**Helm Chart 结构**：
```
infrastructure/helm/
├── app/            # 应用部署
│   ├── Chart.yaml
│   ├── values.yaml # 镜像、副本、资源限制、环境变量
│   └── templates/  # deployment.yaml, service.yaml, ingress.yaml
└── prometheus/     # 监控配置
    └── values.yaml # Prometheus + Grafana + Alertmanager
```

---

## 监控架构

**kube-prometheus-stack 组件**：

| 组件 | 端口 | 作用 |
|------|------|------|
| Prometheus | 9090 | 指标采集与存储 (15d retention) |
| Alertmanager | 9093 | 告警路由 (Email/Slack) |
| Grafana | 3000 | 可视化仪表盘 |
| kube-state-metrics | 8080 | K8s 对象状态 |
| node-exporter | 9100 | 节点级指标 |

**告警规则**：
- Pod 重启 > 3次/1h → Critical
- OOM Kill 检测 → Critical
- Node NotReady → Critical
- PVC 使用率 > 85% → Warning

**兼容方案**：CloudWatch Container Insights 可同时启用，采集更细粒度 AWS 指标。

---

## 部署流程

1. **Terraform 创建基础设施** → EKS 集群、VPC、节点组
2. **构建并推送镜像** → ECR 仓库
3. **Helm 部署应用** → Frontend + FastAPI
4. **Helm 安装监控** → kube-prometheus-stack
5. **Ingress 配置域名** → cert-manager + Let's Encrypt

---

## LangGraph 演进方向

未来引入 LangGraph 实现复杂 AI 推理链：

| 当前模块 | LangGraph 场景 |
|---------|---------------|
| 搜索服务 | Tool: 查 OpenSearch |
| 知识图谱 | Tool: 查 Neptune |
| AI 对话 | LLM 节点 |
| 文档管理 | Tool: 读取文档 |