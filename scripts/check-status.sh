#!/bin/bash
set -e

export CLUSTER_NAME="km-cluster"
export REGION="ap-northeast-1"

echo "=== EKS Cluster Info ==="
aws eks describe-cluster --name $CLUSTER_NAME --region $REGION --query 'cluster.{Name:name,Version:version,Status:status,Endpoint:endpoint}'

echo ""
echo "=== Node Groups ==="
aws eks list-nodegroups --cluster-name $CLUSTER_NAME --region $REGION --output table

echo ""
echo "=== Current Context ==="
kubectl config current-context

echo ""
echo "=== Nodes ==="
kubectl get nodes --label-columns node.kubernetes.io/instance-type,topology.kubernetes.io/zone

echo ""
echo "=== Pods Status ==="
kubectl get pods -n km-system -o wide

echo ""
echo "=== Services Status ==="
kubectl get services -n km-system