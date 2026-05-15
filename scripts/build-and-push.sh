#!/bin/bash
set -e

export CLUSTER_NAME="km-cluster"
export REGION="ap-northeast-1"
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=== Building Docker Images ==="

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
  echo "Building $SERVICE..."
  cd "services/$SERVICE"

  ECR_URL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

  aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URL

  docker build -t "${SERVICE}:latest" .

  docker tag "${SERVICE}:latest" "${ECR_URL}/${SERVICE}:v1.0.0"
  docker tag "${SERVICE}:latest" "${ECR_URL}/${SERVICE}:latest"

  docker push "${ECR_URL}/${SERVICE}:v1.0.0"
  docker push "${ECR_URL}/${SERVICE}:latest"

  echo "$SERVICE pushed to ECR"

  cd ../..
done

echo "=== All images built and pushed ==="