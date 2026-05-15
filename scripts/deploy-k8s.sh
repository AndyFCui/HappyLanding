#!/bin/bash
set -e

export CLUSTER_NAME="km-cluster"
export REGION="ap-northeast-1"
export NAMESPACE="km-system"

echo "=== Deploying to EKS Cluster ==="

aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME

echo "=== Creating Namespaces ==="
kubectl apply -f deployments/k8s/namespaces.yaml

echo "=== Applying Secrets ==="
kubectl apply -f deployments/k8s/secrets.yaml

echo "=== Applying ConfigMaps ==="
kubectl apply -f deployments/k8s/configmaps.yaml

echo "=== Deploying Services ==="

SERVICES=(
  "auth-service"
  "search-service"
  "graph-service"
  "document-service"
  "chat-service"
  "report-service"
  "onboarding-service"
  "datasource-service"
)

for SERVICE in "${SERVICES[@]}"; do
  echo "Deploying $SERVICE..."
  kubectl apply -f "deployments/k8s/${SERVICE}-deployment.yaml" -n $NAMESPACE
  kubectl apply -f "deployments/k8s/${SERVICE}-service.yaml" -n $NAMESPACE
done

echo "=== Rolling Update All Deployments ==="
for SERVICE in "${SERVICES[@]}"; do
  kubectl rollout restart deployment/${SERVICE} -n $NAMESPACE
done

echo "=== Waiting for deployments ==="
for SERVICE in "${SERVICES[@]}"; do
  echo "Waiting for $SERVICE..."
  kubectl rollout status deployment/${SERVICE} -n $NAMESPACE --timeout=300s
done

echo "=== Deployment Complete ==="
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE