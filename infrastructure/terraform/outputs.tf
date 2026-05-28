# ============================================
# Terraform Outputs
# ============================================
# 用途：Terraform apply 后显示的关键信息
# 根据 deployment_mode 显示不同的输出
# ============================================

# ============================================
# ECS 模式输出
# ============================================

output "ecs_cluster_name" {
  description = "ECS 集群名称"
  value       = var.deployment_mode == "ecs" ? aws_ecs_cluster.main[0].name : ""
}

output "ecs_alb_dns_name" {
  description = "ECS ALB DNS 名称（访问应用用）"
  value       = var.deployment_mode == "ecs" ? aws_lb.ecs[0].dns_name : ""
}

output "ecs_vpc_id" {
  description = "ECS VPC ID"
  value       = var.deployment_mode == "ecs" ? aws_vpc.ecs[0].id : ""
}

output "ecs_cluster_security_group" {
  description = "ECS Task 安全组 ID"
  value       = var.deployment_mode == "ecs" ? aws_security_group.ecs_tasks[0].id : ""
}

# ============================================
# EKS 模式输出
# ============================================

output "eks_cluster_endpoint" {
  description = "EKS API Server 地址"
  value       = var.deployment_mode == "eks" ? aws_eks_cluster.main[0].endpoint : ""
}

output "eks_cluster_name" {
  description = "EKS 集群名称"
  value       = var.deployment_mode == "eks" ? aws_eks_cluster.main[0].name : ""
}

output "eks_cluster_arn" {
  description = "EKS 集群 ARN"
  value       = var.deployment_mode == "eks" ? aws_eks_cluster.main[0].arn : ""
}

output "eks_oidc_provider" {
  description = "OIDC Provider ARN（用于 IRSA）"
  value       = var.deployment_mode == "eks" ? aws_iam_openid_connect_provider.eks[0].arn : ""
}

output "eks_vpc_id" {
  description = "EKS VPC ID"
  value       = var.deployment_mode == "eks" ? aws_vpc.eks[0].id : ""
}

output "eks_node_group_name" {
  description = "Node Group 名称"
  value       = var.deployment_mode == "eks" ? aws_eks_node_group.main[0].node_group_name : ""
}

output "eks_node_group_role_arn" {
  description = "Node IAM Role ARN"
  value       = var.deployment_mode == "eks" ? aws_iam_role.eks_nodes[0].arn : ""
}

output "eks_ebs_csi_role_arn" {
  description = "EBS CSI Driver IAM Role ARN"
  value       = var.deployment_mode == "eks" ? aws_iam_role.ebs_csi[0].arn : ""
}

output "kubectl_config_command" {
  description = "配置 kubectl 的命令（EKS 模式）"
  value       = var.deployment_mode == "eks" ? "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main[0].name}" : ""
}

output "eks_private_subnet_ids" {
  description = "EKS 私有子网 ID（Prometheus storage 用）"
  value       = var.deployment_mode == "eks" ? [aws_subnet.eks_private_a[0].id, aws_subnet.eks_private_b[0].id] : []
}

output "eks_public_subnet_ids" {
  description = "EKS 公有子网 ID（Ingress ALB 用）"
  value       = var.deployment_mode == "eks" ? [aws_subnet.eks_public_a[0].id, aws_subnet.eks_public_b[0].id] : []
}

# ============================================
# 共享输出（两种模式都需要）
# ============================================

output "ecr_frontend_repo" {
  description = "Frontend ECR 仓库地址"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_repo" {
  description = "Backend ECR 仓库地址"
  value       = aws_ecr_repository.backend.repository_url
}

output "region" {
  description = "AWS 区域"
  value       = var.aws_region
}

output "deployment_mode" {
  description = "当前部署模式"
  value       = var.deployment_mode
}