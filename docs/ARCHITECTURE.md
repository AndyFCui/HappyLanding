# HappyLanding 架构文档

## 项目概述

**HappyLanding** 是一个基于 AWS 的企业级知识管理平台，支持统一搜索、AI 对话、知识图谱可视化。

**技术栈**：
- 前端：React 18 + Vite + Tailwind CSS + shadcn/ui
- 后端：FastAPI (Python)
- 部署：AWS EKS (Kubernetes)
- 搜索：Amazon OpenSearch
- 图数据库：Amazon Neptune
- AI：AWS Bedrock (Claude)
- 监控：Prometheus + Grafana（兼容 CloudWatch Container Insights）

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS EKS Cluster                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   Frontend │    │  FastAPI    │    │ Prometheus │       │
│  │   (React)  │    │  Backend    │    │ + Grafana  │       │
│  │  Port:3000│    │  Port:8080  │    │  Monitoring│       │
│  └─────────────┘    └──────┬──────┘    └─────────────┘       │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │ OpenSearch  │    │  Neptune   │    │     S3      │   │
│  │  (Search)   │    │  (Graph)   │    │  (Files)    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                             │
│         ┌──────────────────┐                              │
│         ▼                  ▼                              │
│  ┌─────────────┐    ┌─────────────┐                        │
│  │   Bedrock   │    │   Cognito   │                        │
│  │(Claude LLM) │    │   (Auth)    │                        │
│  └─────────────┘    └─────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 模块说明

### 1. 前端 (Frontend)

**技术栈**：React 18 + Vite + Tailwind CSS v4 + shadcn/ui

**目录结构**：
```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/     # AppLayout, Sidebar, Header, Footer
│   │   ├── landing/    # Hero, Features, Problem 等落地页组件
│   │   └── ui/         # shadcn/ui 组件库
│   ├── pages/
│   │   ├── Dashboard/   # 控制台主页
│   │   ├── Search/     # 搜索页
│   │   ├── Chat/       # AI 对话页
│   │   ├── Graph/      # 知识图谱页
│   │   ├── Documents/  # 文档管理页
│   │   └── DesignSystem/ # 设计系统展示
│   └── lib/
│       ├── utils.ts     # cn() 工具函数
│       └── motion.js   # Framer Motion 动画预设
```

**设计系统**：微拟物光影质感
- 渐变背景 + 立体阴影 + 微交互
- 所有颜色使用 CSS 变量（`hsl(var(--primary))`）
- 组件变体：Button(raised/glass)、Card(raised/inset/flat)、Badge(gradient)

---

### 2. 后端 (Backend)

**技术栈**：FastAPI + Python 3.11 + Uvicorn

**目录结构**：
```
backend/fastapi/
├── main.py          # FastAPI 主入口，所有路由
├── requirements.txt # 依赖（fastapi, uvicorn, pydantic, boto3, redis）
└── .venv/          # Python 虚拟环境
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

**部署模式**：Demo 模式（不依赖 AWS 凭证，返回模拟数据）

---

### 3. 部署 (Deployment)

**目标平台**：AWS EKS (Elastic Kubernetes Service)

**Helm Chart 结构**：
```
eks/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    └── configmap.yaml
```

**基础设施**：Terraform IaC

---

### 4. 监控 (Monitoring)

**主方案**：Prometheus + Grafana + Alertmanager（行业标准）

**安装命令**：
```bash
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

**监控维度**：
| 指标 | 来源 |
|------|------|
| Pod 健康状态 | kube-state-metrics |
| Node 资源使用 | node-exporter |
| API 请求延迟 | FastAPI prometheus middleware |
| 服务错误率 | 自定义 metrics |

**告警**：
- Alertmanager 发送至 SNS / Slack / Email
- 预配置告警规则：Pod 重启、OOM、Node 不可用

**兼容方案**：CloudWatch Container Insights

可同时启用 AWS 原生监控，采集更细粒度 AWS 指标：
```bash
# 启用 Container Insights
aws ecs update-cluster-settings --cluster-name your-cluster \
  --settings name=containerInsights,value=enabled
```

**双监控方案架构**：
```
EKS Cluster
    │
    ├── kube-state-metrics ──► Prometheus Server ──► Grafana
    │                                    │
    │                                    └── Alertmanager ──► SNS/Slack
    │
    └── CloudWatch Agent ──► CloudWatch ──► CloudWatch Dashboard
                            (Container Insights)
```

---

## AI 架构（LangGraph 规划）

当前架构未来演进方向：引入 LangGraph 实现复杂推理链。

| 当前模块 | LangGraph 场景 |
|---------|---------------|
| 搜索服务 | Tool: 查 OpenSearch |
| 知识图谱 | Tool: 查 Neptune |
| AI 对话 | LLM 节点 |
| 文档管理 | Tool: 读取文档 |

**LangGraph 工作流示例**：
```
用户提问
    │
    ▼
┌─────────────────┐
│  Search Tool   │ ───► 查 OpenSearch
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Graph Tool    │ ───► 查 Neptune 关联
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   LLM Node     │ ───► Claude 总结答案
└────────┬────────┘
         │
         ▼
    返回结果
```

---

## 开发指南

### 环境要求
- Node.js 18+
- Python 3.11+
- Docker (本地开发)
- kubectl + helm (部署)
- Terraform (IaC)

### 启动命令

**前端**：
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

**后端**：
```bash
cd backend/fastapi
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py  # http://localhost:8080
```

### 部署到 EKS

**基础设施目录结构**：
```
infrastructure/
├── terraform/
│   ├── eks.tf          # EKS 集群配置 (VPC、子网、NAT、EKS、节点组、IAM)
│   ├── variables.tf    # 输入变量
│   └── outputs.tf      # 输出（集群 endpoint、kubectl 配置命令）
└── helm/
    ├── app/            # 应用 Helm Chart (frontend + FastAPI)
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/  # deployment.yaml, service.yaml, ingress.yaml, _helpers.tpl
    └── prometheus/     # kube-prometheus-stack 配置
        └── values.yaml # Prometheus + Grafana + Alertmanager + 预置 Dashboard
```

**部署步骤**：
```bash
# 1. Terraform 初始化并创建 EKS 集群
cd infrastructure/terraform
terraform init
terraform apply

# 获取 kubectl 配置
aws eks update-kubeconfig --region us-east-1 --name happylanding-cluster

# 2. 创建 ECR 仓库（如未创建）
aws ecr create-repository --repository-name happylanding-frontend
aws ecr create-repository --repository-name happylanding-backend

# 3. 构建并推送镜像
docker build -t <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest ./frontend
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest

docker build -t <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest ./backend/fastapi
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest

# 4. 部署应用 Helm Chart
helm install happylanding ./infrastructure/helm/app -n happylanding --create-namespace

# 5. 安装 kube-prometheus-stack 监控
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f ./infrastructure/helm/prometheus/values.yaml

# 6. 启用 CloudWatch Container Insights（兼容方案）
aws ecs update-cluster-settings --cluster-name happylanding-cluster \
  --settings name=containerInsights,value=enabled
```

**CloudWatch 集成**（可选兼容方案）：
```bash
# 在所有节点上安装 CloudWatch Agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/main/k8s-deployment-manifests/deployment向北/cwagent-cfn.yml
```

---

## 监控架构

**主方案：kube-prometheus-stack（行业标准）**

| 组件 | 作用 | 默认端口 |
|------|------|---------|
| Prometheus | 指标采集与存储 | 9090 |
| Alertmanager | 告警路由与发送 | 9093 |
| Grafana | 可视化仪表盘 | 3000 |
| kube-state-metrics | K8s 对象状态 | 8080 |
| node-exporter | 节点级指标 | 9100 |

**Alertmanager 告警规则**：
- Pod 重启检测（1h 内 > 3 次）
- OOM Kill 检测
- Node NotReady 告警
- PVC 使用率 > 85%
- API Server 延迟 > 1s

**兼容方案：CloudWatch Container Insights**
- 部署 CloudWatch Agent 作为 DaemonSet
- 采集容器日志、指标到 CloudWatch
- 通过 CloudWatch Dashboard 查看

---

## 路线图

- [x] 前端 React + Vite + Tailwind
- [x] 后端 FastAPI
- [x] 设计系统 shadcn/ui
- [x] 落地页 Hero + Features
- [x] Dashboard 控制台
- [x] EKS 部署配置 (Terraform + Helm)
- [x] Prometheus 监控（kube-prometheus-stack）
- [x] CloudWatch Container Insights（兼容）
- [ ] LangGraph AI 工作流