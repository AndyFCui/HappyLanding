#!/bin/bash
# KMS Local Development Setup

set -e

echo "=== KMS Local Development Setup ==="

# Install dependencies for all services
for service in services/*/; do
    service_name=$(basename "$service")
    echo "Installing dependencies for $service_name..."
    cd "$service"
    npm install
    cd ../..
done

# Build shared libraries
echo "Building shared libraries..."
cd libs/shared
npm install
npm run build
cd ../..

cd libs/connector-sdk
pip install -e .
cd ../../..

# Create .env files
echo "Creating .env files..."
for service in services/*/; do
    service_name=$(basename "$service")
    if [ ! -f "$service/.env" ]; then
        cat > "$service/.env" << EOF
NODE_ENV=development
PORT=8080
AWS_REGION=ap-northeast-1
LOG_LEVEL=debug
REDIS_HOST=localhost
REDIS_PORT=6379
OPENSEARCH_ENDPOINT=http://localhost:9200
NEPTUNE_ENDPOINT=ws://localhost:8182/gremlin
S3_BUCKET=km-documents-dev
DYNAMODB_TABLE=km-chat-sessions-dev
COGNITO_USER_POOL_ID=ap-northeast-1_dev
COGNITO_CLIENT_ID=dev-client
EOF
        echo "Created .env for $service_name"
    fi
done

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Start local dependencies (Redis, OpenSearch) with docker-compose"
echo "2. Run services individually: cd services/auth-service && npm run dev"
echo ""
echo "Or use Kubernetes: kubectl apply -f deployments/k8s/"