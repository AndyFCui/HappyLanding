# HappyLanding 系统架构

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + Vite + Tailwind CSS v4 + shadcn/ui | 用户界面 |
| 后端 | FastAPI (Python 3.11) | API 服务 |
| 搜索 | Amazon OpenSearch | 全文 + 向量搜索 |
| 图数据库 | Amazon Neptune | 知识图谱存储 |
| AI | AWS Bedrock (Claude 3) | 大语言模型 |
| 容器编排 | AWS ECS Fargate / EKS Kubernetes | 部署平台 |
| 监控 | Prometheus + Grafana + Alertmanager | 指标与告警（EKS 模式） |
| 基础设施 | Terraform | IaC 声明式管理 |

---

## 部署模式

| 模式 | 说明 | 适用场景 | 复杂度 |
|------|------|---------|--------|
| **ecs** | ECS Fargate（简单部署） | 内部工具、小规模、演示 | 低 |
| **eks** | EKS Kubernetes（完整编排） | 生产环境、需要 HPA/自动扩缩容 | 高 |

---

## 基础设施目录结构

```
infrastructure/
├── terraform/           # AWS 基础设施（根据 deployment_mode 切换）
│   ├── main.tf         # ECS 或 EKS 资源（条件创建）
│   ├── variables.tf    # 可配置变量（含 deployment_mode）
│   └── outputs.tf      # ECS/EKS 各自输出
├── helm/               # EKS 模式专用
│   ├── app/            # 应用部署 Chart
│   │   ├── Chart.yaml
│   │   ├── values.yaml # 镜像、副本、资源限制、环境变量、Ingress
│   │   └── templates/  # deployment.yaml / service.yaml / _helpers.tpl
│   └── prometheus/     # 监控 Chart (kube-prometheus-stack)
│       └── values.yaml # Prometheus + Grafana + Alertmanager + Dashboard
└── kubectl/            # EKS 模式专用
    ├── ingress-nginx.yaml  # Nginx Ingress Controller + RBAC
    └── cert-manager.yaml   # Let's Encrypt ClusterIssuer
```

---

## 系统架构图

### ECS 模式

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS ECS Fargate                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐                        │
│  │   Frontend  │    │   FastAPI   │                        │
│  │   (React)   │    │   Backend   │                        │
│  │   Fargate   │    │   Fargate   │                        │
│  │  Port:3000 │    │  Port:8080  │                        │
│  └──────┬──────┘    └──────┬──────┘                        │
│         │                  │                                │
│         └──────────────────┼──────────────────┐             │
│                            ▼                  ▼             │
│                     ┌─────────────┐    ┌─────────────┐      │
│                     │    ALB      │    │ OpenSearch  │      │
│                     │ (端口80/443)│    │   Neptune   │      │
│                     └─────────────┘    └─────────────┘      │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             ▼
                      Internet (HTTPS)
```

### EKS 模式

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS EKS Cluster                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   Frontend  │    │   FastAPI   │    │ Prometheus │      │
│  │   (React)   │    │   Backend   │    │ + Grafana  │      │
│  │   Pod       │    │   Pod       │    │  Monitoring │      │
│  │  Port:3000 │    │  Port:8080  │    │             │      │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘      │
│         │                  │                                 │
│         └──────────────────┼──────────────────┐              │
│                          ▼                  ▼              │
│                   ┌─────────────┐    ┌─────────────┐      │
│                   │ OpenSearch  │    │   Neptune   │      │
│                   │  (Search)   │    │   (Graph)   │      │
│                   └─────────────┘    └─────────────┘      │
│                          │                  │              │
│                   ┌──────┴──────────────────┘              │
│                   ▼                                       │
│            ┌─────────────┐                                │
│            │   Bedrock   │                                │
│            │(Claude LLM) │                                │
│            └─────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 网络拓扑

### ECS 模式

```
Internet
    │
    ▼
┌─────────────────┐
│      ALB        │ (ECS ALB, TLS termination)
│   Port: 80/443  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Frontend│ │Backend │
│Fargate│ │Fargate │
└────────┘ └────────┘
    │         │
    └────┬────┘
         ▼
┌────────────────────────────────┐
│        ECS VPC                │
│        10.0.0.0/16            │
├────────────────────────────────┤
│   Public Subnets (AZ-a/b)      │
│   10.0.1.0/24 | 10.0.2.0/24   │
│   → ALB / Fargate Tasks        │
└────────────────────────────────┘
```

### EKS 模式

```
Internet
    │
    ▼
┌─────────────────┐
│  Nginx Ingress  │ (AWS ALB, TLS termination)
│  (IngressClass) │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Frontend│ │Backend │
│ :3000  │ │ :8080  │
└────────┘ └────────┘
    │         │
    └────┬────┘
         ▼
┌────────────────────────────────┐
│          EKS VPC               │
│          10.0.0.0/16           │
├────────────────────────────────┤
│   Public Subnets (AZ-a/b)      │
│   10.0.1.0/24 | 10.0.2.0/24   │
│   → ALB / NAT Gateway          │
├────────────────────────────────┤
│   Private Subnets (AZ-a/b)     │
│   10.0.10.0/24 | 10.0.11.0/24 │
│   → EKS Nodes / Pods           │
└────────────────────────────────┘
```

---

## 部署流程

### ECS 模式（简单）

```
┌─────────────────────────────────────────────────────────────┐
│                    阶段一：Terraform                         │
│         VPC → Subnets → ALB → ECS Cluster → IAM            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    阶段二：ECR 镜像                          │
│        Docker Build → Push to ECR → 更新 Task 定义          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    阶段三：验证                               │
│              ECS Service → ALB DNS → 访问应用                │
└─────────────────────────────────────────────────────────────┘
```

### EKS 模式（完整）

```
┌─────────────────────────────────────────────────────────────┐
│                    阶段一：Terraform                         │
│  VPC → Subnets → NAT → EKS Cluster → Node Group → IAM → ECR │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    阶段二：kubectl                          │
│         Ingress Controller → cert-manager → Issuer           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    阶段三：ECR 镜像                          │
│        Docker Build → Push to ECR → values.yaml 更新         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    阶段四：Helm 部署                         │
│              happylanding app → kube-prometheus-stack        │
└─────────────────────────────────────────────────────────────┘
```

---

## 监控架构

### ECS 模式

ECS 模式使用 **CloudWatch Container Insights**（简单监控）：

| 组件 | 说明 |
|------|------|
| CloudWatch | 日志聚合、指标存储 |
| Container Insights | 容器级指标（CPU/内存/网络） |

### EKS 模式

EKS 模式使用 **kube-prometheus-stack**（完整监控）：

| 组件 | 端口 | 作用 |
|------|------|------|
| Prometheus | 9090 | 指标采集与存储（15d retention，100GiB gp3） |
| Alertmanager | 9093 | 告警路由（Email + Slack） |
| Grafana | 3000 | 可视化仪表盘（预置 K8s Dashboard） |
| kube-state-metrics | 8080 | K8s 对象状态 |
| node-exporter | 9100 | 节点级指标 |

**告警规则**：
- Pod 重启 > 3次/1h → Critical
- OOM Kill 检测 → Critical
- Node NotReady → Critical
- PVC 使用率 > 85% → Warning

**兼容方案**：CloudWatch Container Insights 可同时启用。

---

## 前端模块

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

> **注意**：当前为 Mock 实现，所有 `/v1/*` 路由返回模拟数据。真实业务逻辑待实现。

```
backend/fastapi/
├── main.py          # FastAPI 主入口，所有路由（Mock）
├── requirements.txt # 依赖
└── *_service/      # 8 个 service 目录（空目录，占位符）
    ├── auth_service/      # 空（待实现用户认证）
    ├── chat_service/     # 空（待实现 AI 对话）
    ├── datasource_service/# 空（待实现数据源连接）
    ├── document_service/ # 空（待实现文档管理）
    ├── graph_service/    # 空（待实现知识图谱）
    ├── onboarding_service/# 空（待实现入职流程）
    ├── report_service/   # 空（待实现报表）
    └── search_service/   # 空（待实现搜索）
```

**API 路由**：
| 路径 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/health` | GET | 健康检查 | ✅ 完成 |
| `/health/ready` | GET | 就绪检查 | ✅ 完成 |
| `/v1/search` | POST | 搜索接口 | ✅ Mock |
| `/v1/chat/sessions/{id}/messages` | POST | AI 对话 | ✅ Mock |
| `/v1/graph/entities` | POST | 创建实体 | ✅ Mock |
| `/v1/graph/entities/{id}` | GET | 获取实体 | ✅ Mock |
| `/v1/documents` | GET | 文档列表 | ✅ Mock |

---

## LangGraph 演进方向

未来引入 LangGraph 实现复杂 AI 推理链：

| 当前模块 | LangGraph 场景 |
|---------|---------------|
| 搜索服务 | Tool: 查 OpenSearch |
| 知识图谱 | Tool: 查 Neptune |
| AI 对话 | LLM 节点 |
| 文档管理 | Tool: 读取文档 |