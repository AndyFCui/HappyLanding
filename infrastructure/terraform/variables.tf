# ============================================
# Terraform Variables
# ============================================
# 用途：定义部署的可配置参数
# 支持两种部署模式：ecs (简单) / eks (完整 K8s)
# ============================================

variable "aws_region" {
  description = "AWS 区域"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "项目名称（用于资源命名）"
  type        = string
  default     = "happylanding"
}

variable "environment" {
  description = "环境（dev/staging/prod）"
  type        = string
  default     = "prod"
}

# ============================================
# 部署模式：ecs (Fargate) / eks (Kubernetes)
# ============================================

variable "deployment_mode" {
  description = "部署模式：ecs (Fargate 简单部署) / eks (完整 K8s 编排)"
  type        = string
  default     = "ecs"
}

# ============================================
# ECS Fargate 配置（deployment_mode = "ecs" 时使用）
# ============================================

variable "ecs_cluster_name" {
  description = "ECS 集群名称"
  type        = string
  default     = "happylanding-cluster"
}

variable "fargate_vpc_cidr" {
  description = "ECS 模式 VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "fargate_public_subnet_a_cidr" {
  description = "公有子网 A（ECS ALB 用）"
  type        = string
  default     = "10.0.1.0/24"
}

variable "fargate_public_subnet_b_cidr" {
  description = "公有子网 B（ECS ALB 用）"
  type        = string
  default     = "10.0.2.0/24"
}

# ============================================
# EKS 配置（deployment_mode = "eks" 时使用）
# ============================================

variable "cluster_name" {
  description = "EKS 集群名称"
  type        = string
  default     = "happylanding-cluster"
}

variable "kubernetes_version" {
  description = "K8s 版本"
  type        = string
  default     = "1.29"
}

# VPC CIDR 配置
variable "vpc_cidr" {
  description = "EKS 模式 VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_a_cidr" {
  description = "公有子网 A（AZ 1）"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_b_cidr" {
  description = "公有子网 B（AZ 2）"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_subnet_a_cidr" {
  description = "私有子网 A（AZ 1）"
  type        = string
  default     = "10.0.10.0/24"
}

variable "private_subnet_b_cidr" {
  description = "私有子网 B（AZ 2）"
  type        = string
  default     = "10.0.11.0/24"
}

# Node Group 配置
variable "node_desired_size" {
  description = "节点组期望副本数"
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "节点组最大副本数"
  type        = number
  default     = 4
}

variable "node_min_size" {
  description = "节点组最小副本数"
  type        = number
  default     = 2
}

variable "node_instance_types" {
  description = "节点实例类型"
  type        = list(string)
  default     = ["t3.medium"]
}

# ============================================
# 域名配置（可选）
# ============================================

variable "domain_name" {
  description = "Route53 托管域名（如有）"
  type        = string
  default     = "happylanding.example.com"
}