# HappyLanding 部署指南

## 环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 前端开发/构建 |
| Python | 3.11+ | 后端 FastAPI |
| Docker | 最新 | 镜像构建 |
| kubectl | 1.29+ | K8s 集群管理 |
| helm | 3.12+ | 应用打包 |
| terraform | 1.5+ | 基础设施编排 |
| AWS CLI | 2.x | AWS 资源管理 |

---

## 本地开发

### 前端

```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:3000
```

### 后端

```bash
cd backend/fastapi
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
# 访问 http://localhost:8080
```

---

## 构建 Docker 镜像

### 前端镜像

```bash
docker build -t happylanding-frontend:latest ./frontend
```

### 后端镜像

```bash
docker build -t happylanding-backend:latest ./backend/fastapi
```

---

## AWS EKS 部署

### 1. 创建 EKS 集群（Terraform）

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

输出显示：
- `eks_cluster_endpoint` - 集群 API 地址
- `kubectl_config_command` - kubectl 配置命令

### 2. 配置 kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name happylanding-cluster
```

### 3. 创建 ECR 镜像仓库

```bash
aws ecr create-repository --repository-name happylanding-frontend --region us-east-1
aws ecr create-repository --repository-name happylanding-backend --region us-east-1
```

### 4. 推送镜像到 ECR

```bash
# 登录 ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# 前端镜像
docker tag happylanding-frontend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-frontend:latest

# 后端镜像
docker tag happylanding-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/happylanding-backend:latest
```

### 5. 部署应用（Helm）

```bash
# 更新 Helm values 中的镜像地址
# 编辑 infrastructure/helm/app/values.yaml
# 将 <ECR_REGISTRY> 替换为你的 AWS Account ID

# 安装应用
helm install happylanding ./infrastructure/helm/app \
  -n happylanding --create-namespace

# 检查部署状态
kubectl get pods -n happylanding
```

### 6. 安装监控（kube-prometheus-stack）

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f ./infrastructure/helm/prometheus/values.yaml

# 检查组件
kubectl get pods -n monitoring
```

### 7. 配置域名（Ingress）

```bash
# 安装 cert-manager（Let's Encrypt 证书）
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# 创建 ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 8. 启用 CloudWatch Container Insights（可选）

```bash
# 用于 CloudWatch 原生监控（兼容方案）
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/main/k8s-deployment-manifests/deployment向北/cwagent-cfn.yml
```

---

## 验证部署

```bash
# 检查所有 Pod
kubectl get pods -A

# 检查服务
kubectl get svc -n happylanding

# 查看日志
kubectl logs -n happylanding -l app=frontend
kubectl logs -n happylanding -l app=backend

# 访问 Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# 打开 http://localhost:3000 (admin/prom-operator)

# 查看 Alertmanager
kubectl port-forward -n monitoring svc/alertmanager-main 9093:9093
# 打开 http://localhost:9093
```

---

## 卸载

```bash
helm uninstall happylanding -n happylanding
helm uninstall prometheus -n monitoring
terraform destroy -auto-approve
```