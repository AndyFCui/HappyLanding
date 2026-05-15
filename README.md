# HappyLanding - 企业知识管理系统

一站式企业团队知识协同管理平台
整合多渠道办公资源、云端文件、业务文档、行业资料与个人经验沉淀，搭建统一信息中枢。
内置全域智能检索、可视化知识图谱、标准化团队入职指引、项目全流程交接台账等能力，
助力团队完成知识系统化沉淀、信息快速检索、人员快速融入、项目资料高效对接，全面提升团队协作与业务流转效率。

## 系统架构

基于 AWS 的微服务架构，支持 Docker 一键私有化部署和 Kubernetes 管理。

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层                                  │
│              Web (React SPA) / 移动端 / SDK                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                        接入层 (ALB + WAF)                         │
│                   API Gateway / CloudFront                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      应用服务层 (ECS Fargate)                      │
│  auth  │ search │ graph │ document │ chat │ report │ onboarding  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    数据层 / AI/ML 层                              │
│   OpenSearch  │  Neptune  │  RDS  │  S3  │  DynamoDB  │  Redis   │
│   Bedrock (Claude/Titan)  │  Comprehend  │  Kendra               │
└─────────────────────────────────────────────────────────────────┘
```

## 核心功能

| 功能 | 说明 | 技术栈 |
|------|------|--------|
| 统一搜索 | 全文 + 向量混合搜索 | OpenSearch, Titan Embedding |
| 知识图谱 | 实体关系可视化与图遍历 | Neptune, Gremlin |
| AI 对话 | RAG 增强的企业知识问答 | Bedrock Claude, Knowledge Bases |
| 报告生成 | LLM 驱动的智能报告 | Bedrock Claude |
| 入职引导 | 新员工关键词探索与学习路径 | Bedrock Claude, OpenSearch |
| 数据源接入 | 钉钉/SharePoint/Confluence 同步 | EventBridge, Lambda |

## 目录结构

```
HappyLanding/
├── services/                    # 8 个微服务
│   ├── auth-service/            # 认证服务 (Cognito JWT)
│   ├── search-service/          # 搜索服务 (OpenSearch Hybrid Search)
│   ├── graph-service/           # 图谱服务 (Neptune Gremlin)
│   ├── document-service/       # 文档服务 (S3 + Step Functions)
│   ├── chat-service/            # 对话服务 (Bedrock Claude + DynamoDB)
│   ├── report-service/          # 报告生成 (Bedrock + S3)
│   ├── onboarding-service/     # 入职引导 (Bedrock + OpenSearch)
│   └── datasource-service/      # 数据源管理 (EventBridge + Lambda)
│
├── libs/                        # 共享库
│   ├── shared/                  # TypeScript 共享工具 (@km/shared)
│   └── connector-sdk/           # Python 连接器 SDK
│
├── infrastructure/              # 基础设施代码
│   ├── terraform/               # Terraform 模板 (VPC/RDS/OS/Redis)
│   └── cdk/                     # CloudFormation 模板
│
├── deployments/                 # 部署配置
│   ├── k8s/                     # Kubernetes YAML
│   └── helm/                    # Helm Chart
│
└── scripts/                     # 运维脚本
```

## 快速开始

### 1. 本地开发

```bash
# 启动本地依赖 (Redis, OpenSearch, LocalStack)
docker-compose up -d

# 安装服务依赖
./scripts/local-setup.sh

# 运行单个服务
cd services/auth-service && npm run dev
```

### 2. 构建 Docker 镜像

```bash
./scripts/build-and-push.sh
```

### 3. 部署到 Kubernetes

```bash
# 配置 kubectl
aws eks update-kubeconfig --region ap-northeast-1 --name km-cluster

# 部署所有服务
./scripts/deploy-k8s.sh

# 检查状态
./scripts/check-status.sh
```

### 4. 使用 Helm 部署

```bash
helm install km-system ./deployments/helm \
  --namespace km-system \
  --create-namespace \
  --values ./deployments/helm/values.yaml
```

## API 端点

| 服务 | 端点 | 功能 |
|------|------|------|
| auth-service | `/v1/auth` | 登录/注册/JWT 验证 |
| search-service | `/v1/search` | 全文/向量混合搜索 |
| graph-service | `/v1/graph` | 知识图谱 CRUD、关系查询 |
| document-service | `/v1/documents` | 文档上传/下载/管理 |
| chat-service | `/v1/chat` | AI 对话、RAG 问答 |
| report-service | `/v1/reports` | 报告生成、导出 |
| onboarding-service | `/v1/onboarding` | 新员工引导、关键词探索 |
| datasource-service | `/v1/datasources` | 数据源连接器管理 |

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `AWS_REGION` | AWS 区域 | `ap-northeast-1` |
| `OPENSEARCH_ENDPOINT` | OpenSearch 端点 | `https://...` |
| `NEPTUNE_ENDPOINT` | Neptune 端点 | `wss://...` |
| `REDIS_HOST` | Redis 主机 | `redis.km-data.svc` |
| `S3_BUCKET` | 文档存储桶 | `km-documents` |
| `COGNITO_USER_POOL_ID` | Cognito 用户池 ID | `ap-northeast-1_xxx` |
| `COGNITO_CLIENT_ID` | Cognito 客户端 ID | `xxx` |

## Kubernetes 资源

- **Namespace**: `km-system`, `km-apps`, `km-data`
- **Deployment**: 每个服务 2+ 副本，跨 AZ 部署
- **Service**: ClusterIP 类型
- **HPA**: 基于 CPU/内存的自动伸缩
- **PDB**: 滚动更新保护 (minAvailable: 1)
- **Ingress**: Nginx Ingress + TLS (可选)
- **ConfigMap**: `km-config` 共享配置
- **Secret**: `aws-secrets` AWS 凭据
- **CronJob**: 数据备份、Sessions 清理、数据源同步

## 数据存储

| 存储 | 用途 | 规格 |
|------|------|------|
| OpenSearch | 全文 + 向量搜索 | 3 数据节点 + 3 主节点, UltraWarm |
| Neptune | 知识图谱 | db.r6g.large Multi-AZ |
| RDS PostgreSQL | 结构化数据 | db.r6g.large Multi-AZ + 只读副本 |
| DynamoDB | 会话/时间线 | On-Demand 模式 |
| Redis | 缓存 | cache.r6g.large Cluster 模式 |
| S3 | 文档存储 | 标准 + 生命周期策略 |

## 成本估算 (AWS 亚太区域)

| 规模 | 用户 | 文档 | 月成本 (USD) |
|------|------|------|-------------|
| 小规模 | 10 | 10K | ~$600 |
| 中规模 | 100 | 100K | ~$4,000 |
| 大规模 | 500+ | 1M | ~$18,000 |

## 开发

```bash
# 安装依赖
cd services/auth-service && npm install

# 运行测试
npm test

# 代码检查
npm run lint

# 本地运行
npm run dev
```

## License

Proprietary
