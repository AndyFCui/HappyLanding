# HappyLanding 部署指南

## 环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 前端开发/构建 |
| Python | 3.11+ | 后端 FastAPI |
| Docker | 最新 | 镜像构建 |
| kubectl | 1.29+ | EKS 模式必需 |
| helm | 3.12+ | EKS 模式必需 |
| terraform | 1.5+ | 基础设施编排 |
| AWS CLI | 2.x | AWS 资源管理 |

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
├── terraform/           # AWS 基础设施
│   ├── main.tf         # 全部资源（根据 deployment_mode 切换）
│   ├── variables.tf    # 可配置变量（含 deployment_mode）
│   └── outputs.tf      # 关键输出（ECS/EKS 各自输出）
├── helm/               # EKS 模式专用
│   ├── app/            # 应用部署 Chart
│   └── prometheus/     # 监控 Chart (kube-prometheus-stack)
└── kubectl/            # EKS 模式专用
    ├── ingress-nginx.yaml  # Nginx Ingress Controller
    └── cert-manager.yaml   # Let's Encrypt 证书管理
```

---

## 部署流程

### 阶段一：Terraform 基础设施

**1. 配置 AWS 凭证**

```bash
aws configure
# 输入 Access Key / Secret / Region (us-east-1)
```

**2. 创建 Terraform State S3 Bucket**

```bash
aws s3 mb s3://happylanding-terraform-state --region us-east-1
aws s3api put-bucket-versioning \
  --bucket happylanding-terraform-state \
  --versioning-configuration Status=Enabled
```

**3. 配置部署模式**

```hcl
# infrastructure/terraform/terraform.tfvars
deployment_mode = "ecs"  # 或 "eks"
```

**4. Terraform 初始化并部署**

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

**5. 获取输出信息**

```bash
# ECS 模式输出
ecs_cluster_name = happylanding-cluster
ecs_alb_dns_name = happylanding-ecs-alb-xxx.elb.amazonaws.com

# EKS 模式输出
eks_cluster_name = happylanding-cluster
kubectl_config_command = aws eks update-kubeconfig --region us-east-1 --name happylanding-cluster

# 两种模式都有
ecr_frontend_repo = <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend
ecr_backend_repo  = <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend
```

---

### 阶段二：ECR 镜像构建与推送

**（ECS 和 EKS 模式相同）**

**6. 创建 ECR 仓库**

```bash
aws ecr create-repository --repository-name happylanding-frontend --region us-east-1
aws ecr create-repository --repository-name happylanding-backend --region us-east-1
```

**7. 登录 ECR**

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
```

**8. 构建并推送镜像**

```bash
# Frontend
docker build -t <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest ./frontend
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest

# Backend
docker build -t <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest ./backend/fastapi
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest
```

---

### 阶段三：后续步骤（按部署模式）

#### ECS 模式（简单）

ECS 模式下，应用已通过 Terraform 部署完成（ALB + ECS Fargate Task）。

**更新 ECS Task 定义中的镜像地址（手动或在 AWS Console）**：

```bash
# 查看当前 Task 定义
aws ecs list-task-definitions --family-prefix happylanding

# 更新镜像（需要替换 <ACCOUNT> 和 <REGION>）
aws ecs update-task-definition --task-definition happylanding-frontend \
  --container-definitions '[{"name":"frontend","image":"<ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/happylanding-frontend:latest"}]'
```

**验证 ECS 部署**：

```bash
# 查看服务状态
aws ecs describe-services --cluster happylanding-cluster --services happylanding-frontend happylanding-backend

# 查看 ALB DNS
aws elbv2 describe-load-balancers --names happylanding-ecs-alb
# 访问 http://<alb-dns-name>
```

#### EKS 模式（完整 K8s）

**9. 配置 kubectl**

```bash
aws eks update-kubeconfig --region us-east-1 --name happylanding-cluster
kubectl get nodes
```

**10. 安装 Nginx Ingress Controller**

```bash
kubectl apply -f infrastructure/kubectl/ingress-nginx.yaml
kubectl get pods -n ingress-nginx
```

**11. 安装 cert-manager（Let's Encrypt）**

```bash
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

kubectl apply -f infrastructure/kubectl/cert-manager.yaml
kubectl get clusterissuer
```

**12. 更新 Helm values.yaml 镜像地址**

```yaml
# infrastructure/helm/app/values.yaml
image:
  frontend: <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest
  backend: <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest
```

**13. 部署 HappyLanding 应用**

```bash
helm install happylanding ./infrastructure/helm/app \
  -n happylanding --create-namespace

kubectl get pods -n happylanding
```

**14. 部署 kube-prometheus-stack 监控**

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f ./infrastructure/helm/prometheus/values.yaml

kubectl get pods -n monitoring
```

---

## 验证部署

### ECS 模式

```bash
# 查看 ECS 服务
aws ecs list-services --cluster happylanding-cluster

# 查看 ALB 目标组健康
aws elbv2 describe-target-health --target-group-arn <tg-arn>

# 访问应用
curl http://<ecs-alb-dns-name>
```

### EKS 模式

```bash
# 检查所有 Pod
kubectl get pods -A

# 检查服务
kubectl get svc -n happylanding

# 端口转发测试
kubectl port-forward -n happylanding svc/happylanding-frontend 3000:3000
# 访问 http://localhost:3000

# Prometheus UI
kubectl port-forward -n monitoring svc/prometheus-server 9090:9090
# 访问 http://localhost:9090

# Grafana UI
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# 访问 http://localhost:3000 (admin/prom-operator)
```

---

## 卸载

### ECS 模式

```bash
# 删除 ECS 服务
aws ecs update-service --cluster happylanding-cluster --service happylanding-frontend --desired-count 0
aws ecs update-service --cluster happylanding-cluster --service happylanding-backend --desired-count 0

# 删除 Terraform 资源
cd infrastructure/terraform
terraform destroy
```

### EKS 模式

```bash
# 删除 Helm Release
helm uninstall happylanding -n happylanding
helm uninstall prometheus -n monitoring

# 删除 K8s 组件
kubectl delete -f infrastructure/kubectl/cert-manager.yaml
kubectl delete -f infrastructure/kubectl/ingress-nginx.yaml

# 删除 Terraform 资源
cd infrastructure/terraform
terraform destroy
```

---

## 快速部署命令汇总

### ECS 模式（简单部署）

```bash
aws configure && \
aws s3 mb s3://happylanding-terraform-state --region us-east-1 && \
cd infrastructure/terraform && \
echo 'deployment_mode = "ecs"' > terraform.tfvars && \
terraform init && terraform apply && \
aws ecr create-repository --repository-name happylanding-frontend && \
aws ecr create-repository --repository-name happylanding-backend && \
docker build -t <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest ./frontend && \
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest && \
docker build -t <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest ./backend/fastapi && \
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest && \
echo "Done! Access at: http://$(terraform output -raw ecs_alb_dns_name)"
```

### EKS 模式（完整 K8s）

```bash
aws configure && \
aws s3 mb s3://happylanding-terraform-state --region us-east-1 && \
cd infrastructure/terraform && \
echo 'deployment_mode = "eks"' > terraform.tfvars && \
terraform init && terraform apply && \
aws eks update-kubeconfig --region us-east-1 --name happylanding-cluster && \
kubectl apply -f infrastructure/kubectl/ingress-nginx.yaml && \
helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set installCRDs=true && \
kubectl apply -f infrastructure/kubectl/cert-manager.yaml && \
aws ecr create-repository --repository-name happylanding-frontend && \
aws ecr create-repository --repository-name happylanding-backend && \
docker build -t <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest ./frontend && \
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest && \
docker build -t <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest ./backend/fastapi && \
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest && \
helm install happylanding ./infrastructure/helm/app -n happylanding --create-namespace && \
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace -f ./infrastructure/helm/prometheus/values.yaml
```

---

## 配置清单

| 配置项 | 文件 | 说明 |
|--------|------|------|
| AWS 凭证 | `~/.aws/credentials` | `aws configure` |
| 部署模式 | `infrastructure/terraform/terraform.tfvars` | `deployment_mode = "ecs"` 或 `"eks"` |
| ECS Task 镜像 | AWS Console / CLI | 替换 `<ECR_REGISTRY>` |
| EKS Helm 镜像 | `infrastructure/helm/app/values.yaml` | 替换 `<account>.dkr.ecr...` |
| 域名 | `infrastructure/helm/app/values.yaml` | EKS 模式，替换 `happylanding.example.com` |
| SMTP | `infrastructure/helm/prometheus/values.yaml` | EKS 模式，替换邮件告警配置 |
| Slack | `infrastructure/helm/prometheus/values.yaml` | EKS 模式，替换 Slack Webhook |