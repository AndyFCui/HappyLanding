# Knowledge Management System Helm Chart

## Introduction

This Helm chart deploys the Knowledge Management System microservices on Kubernetes.

## Architecture

The system consists of 8 microservices:
- **auth-service**: Authentication via AWS Cognito
- **search-service**: Full-text and vector search via OpenSearch
- **graph-service**: Knowledge graph via Neptune
- **document-service**: Document upload and management via S3
- **chat-service**: AI chat with Bedrock Claude
- **report-service**: Report generation
- **onboarding-service**: New employee onboarding
- **datasource-service**: Data source connector management

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- AWS IAM Role for service account (IRSA)
- cert-manager for TLS (optional)

## Installing the Chart

```bash
helm repo add km https://charts.km.example.com
helm repo update

helm install km-system km/km-system \
  --namespace km-system \
  --create-namespace \
  --values values.yaml
```

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.fullnameOverride` | Override resource names | `km` |
| `global.namespace` | Target namespace | `km-system` |
| `*.enabled` | Enable/disable service | `true` |
| `*.replicaCount` | Number of replicas | `2` |
| `*.image.repository` | Docker image repository | `km-registry/<service>` |
| `*.image.tag` | Docker image tag | `v1.0.0` |
| `*.resources` | CPU/Memory resource limits | See values.yaml |
| `*.autoscaling.enabled` | Enable HPA | `true` |
| `*.autoscaling.minReplicas` | Min replicas | `2` |
| `*.autoscaling.maxReplicas` | Max replicas | `10` |

## Components

### Services
All 8 microservices are deployed with:
- Health check endpoints (/health, /health/ready)
- Resource limits and requests
- Pod anti-affinity for HA
- Horizontal Pod Autoscaler

### Data Layer
- Redis for caching
- OpenSearch for search (optional, external preferred)
- ConfigMaps for configuration

### Networking
- ClusterIP services
- Ingress with TLS (optional)
- PodDisruptionBudgets for HA

## Uninstalling

```bash
helm uninstall km-system --namespace km-system
```

## License

Proprietary