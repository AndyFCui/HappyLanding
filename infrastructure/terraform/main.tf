# ============================================
# HappyLanding IaC - Terraform
# ============================================
# 用途：声明 AWS 基础设施
# 支持两种部署模式：
#   - deployment_mode = "ecs"   → ECS Fargate（简单部署）
#   - deployment_mode = "eks"   → EKS Kubernetes（完整编排）
# 顺序：terraform init → terraform plan → terraform apply
# ============================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }

  # Terraform State 存储到 S3（需先手动创建 bucket）
  backend "s3" {
    bucket = "happylanding-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# ============================================
# 数据源：可用区 + TLS 证书
# ============================================

data "aws_availability_zones" "available" {}

# ============================================
# ECS Fargate 模式资源（deployment_mode = "ecs"）
# ============================================

# ECS VPC（仅 ECS 模式创建）
resource "aws_vpc" "ecs" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  cidr = var.fargate_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Name        = "${var.project}-ecs-vpc"
    Project     = var.project
    Environment = var.environment
    Mode        = "ecs"
  }
}

# ECS 公有子网（ALB 用）
resource "aws_subnet" "ecs_public_a" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  vpc_id                  = aws_vpc.ecs[0].id
  cidr_block             = var.fargate_public_subnet_a_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project}-ecs-public-a"
  }
}

resource "aws_subnet" "ecs_public_b" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  vpc_id                  = aws_vpc.ecs[0].id
  cidr_block             = var.fargate_public_subnet_b_cidr
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project}-ecs-public-b"
  }
}

# ECS Internet Gateway
resource "aws_internet_gateway" "ecs" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  vpc_id = aws_vpc.ecs[0].id

  tags = {
    Name = "${var.project}-ecs-igw"
  }
}

# ECS 路由表
resource "aws_route_table" "ecs_public" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  vpc_id = aws_vpc.ecs[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ecs[0].id
  }

  tags = {
    Name = "${var.project}-ecs-public-rt"
  }
}

resource "aws_route_table_association" "ecs_public_a" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  subnet_id      = aws_subnet.ecs_public_a[0].id
  route_table_id = aws_route_table.ecs_public[0].id
}

resource "aws_route_table_association" "ecs_public_b" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  subnet_id      = aws_subnet.ecs_public_b[0].id
  route_table_id = aws_route_table.ecs_public[0].id
}

# ECS 安全组
resource "aws_security_group" "ecs_alb" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  name        = "${var.project}-ecs-alb-sg"
  description = "ECS ALB 安全组"
  vpc_id      = aws_vpc.ecs[0].id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-ecs-alb-sg"
  }
}

resource "aws_security_group" "ecs_tasks" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  name        = "${var.project}-ecs-tasks-sg"
  description = "ECS Fargate Task 安全组"
  vpc_id      = aws_vpc.ecs[0].id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    security_groups = [aws_security_group.ecs_alb[0].id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-ecs-tasks-sg"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  name = var.ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = var.ecs_cluster_name
    Project     = var.project
    Environment = var.environment
  }
}

# ECS Task Execution IAM Role
resource "aws_iam_role" "ecs_task_execution" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  name = "${var.project}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  role       = aws_iam_role.ecs_task_execution[0].name
}

# ECS ALB
resource "aws_lb" "ecs" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  name               = "${var.project}-ecs-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ecs_alb[0].id]
  subnets           = [aws_subnet.ecs_public_a[0].id, aws_subnet.ecs_public_b[0].id]

  enable_deletion_protection = false

  tags = {
    Name = "${var.project}-ecs-alb"
  }
}

# ECS Target Group（Frontend）
resource "aws_lb_target_group" "frontend" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  name     = "${var.project}-frontend-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.ecs[0].id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
}

# ECS Target Group（Backend）
resource "aws_lb_target_group" "backend" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  name     = "${var.project}-backend-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.ecs[0].id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
}

# ECS ALB Listener
resource "aws_lb_listener" "ecs" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  load_balancer_arn = aws_lb.ecs[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_lb_target_group.frontend[0].arn
    type             = "forward"
  }
}

# ECS Service - Frontend
resource "aws_ecs_service" "frontend" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  name            = "${var.project}-frontend"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.frontend[0].arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.ecs_public_a[0].id, aws_subnet.ecs_public_b[0].id]
    security_groups  = [aws_security_group.ecs_tasks[0].id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend[0].arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.ecs]

  tags = {
    Name = "${var.project}-frontend"
  }
}

# ECS Task Definition - Frontend
resource "aws_ecs_task_definition" "frontend" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  family                   = "${var.project}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  execution_role_arn = aws_iam_role.ecs_task_execution[0].arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = "<ECR_REGISTRY>/happylanding-frontend:latest"
    essential = true
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
    }
  }])

  tags = {
    Name = "${var.project}-frontend-td"
  }
}

# ECS Task Definition - Backend
resource "aws_ecs_task_definition" "backend" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  family                   = "${var.project}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  execution_role_arn = aws_iam_role.ecs_task_execution[0].arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "<ECR_REGISTRY>/happylanding-backend:latest"
    essential = true
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      { name = "ENVIRONMENT", value = "production" },
      { name = "LOG_LEVEL", value = "info" }
    ]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
    }
  }])

  tags = {
    Name = "${var.project}-backend-td"
  }
}

# ECS Service - Backend
resource "aws_ecs_service" "backend" {
  count = var.deployment_mode == "ecs" ? 1 : 0

  name            = "${var.project}-backend"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.backend[0].arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.ecs_public_a[0].id, aws_subnet.ecs_public_b[0].id]
    security_groups  = [aws_security_group.ecs_tasks[0].id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend[0].arn
    container_name   = "backend"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.ecs]

  tags = {
    Name = "${var.project}-backend"
  }
}

# ============================================
# EKS 模式资源（deployment_mode = "eks"）
# ============================================

# EKS VPC
resource "aws_vpc" "eks" {
  count = var.deployment_mode == "eks" ? 1 : 0

  cidr = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Name        = "${var.project}-eks-vpc"
    Project     = var.project
    Environment = var.environment
    Mode        = "eks"
  }
}

# EKS 公有子网
resource "aws_subnet" "eks_public_a" {
  count = var.deployment_mode == "eks" ? 1 : 0

  vpc_id                  = aws_vpc.eks[0].id
  cidr_block             = var.public_subnet_a_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project}-eks-public-a"
    "kubernetes.io/role/elb" = "1"
  }
}

resource "aws_subnet" "eks_public_b" {
  count = var.deployment_mode == "eks" ? 1 : 0

  vpc_id                  = aws_vpc.eks[0].id
  cidr_block             = var.public_subnet_b_cidr
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project}-eks-public-b"
    "kubernetes.io/role/elb" = "1"
  }
}

# EKS 私有子网
resource "aws_subnet" "eks_private_a" {
  count = var.deployment_mode == "eks" ? 1 : 0

  vpc_id                  = aws_vpc.eks[0].id
  cidr_block             = var.private_subnet_a_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "${var.project}-eks-private-a"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

resource "aws_subnet" "eks_private_b" {
  count = var.deployment_mode == "eks" ? 1 : 0

  vpc_id                  = aws_vpc.eks[0].id
  cidr_block             = var.private_subnet_b_cidr
  availability_zone       = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "${var.project}-eks-private-b"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# EKS Internet Gateway
resource "aws_internet_gateway" "eks" {
  count = var.deployment_mode == "eks" ? 1 : 0

  vpc_id = aws_vpc.eks[0].id

  tags = {
    Name = "${var.project}-eks-igw"
  }
}

# EKS NAT Gateway
resource "aws_eip" "eks_nat" {
  count = var.deployment_mode == "eks" ? 1 : 0

  domain = "vpc"
}

resource "aws_nat_gateway" "eks" {
  count = var.deployment_mode == "eks" ? 1 : 0

  allocation_id = aws_eip.eks_nat[0].id
  subnet_id     = aws_subnet.eks_public_a[0].id

  tags = {
    Name = "${var.project}-eks-nat"
  }
}

# EKS 路由表
resource "aws_route_table" "eks_public" {
  count = var.deployment_mode == "eks" ? 1 : 0

  vpc_id = aws_vpc.eks[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eks[0].id
  }

  tags = {
    Name = "${var.project}-eks-public-rt"
  }
}

resource "aws_route_table" "eks_private" {
  count = var.deployment_mode == "eks" ? 1 : 0

  vpc_id = aws_vpc.eks[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.eks[0].id
  }

  tags = {
    Name = "${var.project}-eks-private-rt"
  }
}

# EKS 子网关联路由表
resource "aws_route_table_association" "eks_public_a" {
  count = var.deployment_mode == "eks" ? 1 : 0

  subnet_id      = aws_subnet.eks_public_a[0].id
  route_table_id = aws_route_table.eks_public[0].id
}

resource "aws_route_table_association" "eks_public_b" {
  count = var.deployment_mode == "eks" ? 1 : 0

  subnet_id      = aws_subnet.eks_public_b[0].id
  route_table_id = aws_route_table.eks_public[0].id
}

resource "aws_route_table_association" "eks_private_a" {
  count = var.deployment_mode == "eks" ? 1 : 0

  subnet_id      = aws_subnet.eks_private_a[0].id
  route_table_id = aws_route_table.eks_private[0].id
}

resource "aws_route_table_association" "eks_private_b" {
  count = var.deployment_mode == "eks" ? 1 : 0

  subnet_id      = aws_subnet.eks_private_b[0].id
  route_table_id = aws_route_table.eks_private[0].id
}

# EKS 安全组
resource "aws_security_group" "eks_workers" {
  count = var.deployment_mode == "eks" ? 1 : 0

  name        = "${var.project}-eks-workers-sg"
  description = "EKS 节点安全组"
  vpc_id      = aws_vpc.eks[0].id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-eks-workers-sg"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  count = var.deployment_mode == "eks" ? 1 : 0

  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster[0].arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids = [
      aws_subnet.eks_public_a[0].id,
      aws_subnet.eks_public_b[0].id,
      aws_subnet.eks_private_a[0].id,
      aws_subnet.eks_private_b[0].id
    ]
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy[0],
    aws_iam_role_policy_attachment.eks_vpc_resource_controller[0]
  ]

  tags = {
    Name        = var.cluster_name
    Project     = var.project
    Environment = var.environment
  }
}

# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  count = var.deployment_mode == "eks" ? 1 : 0

  name = "${var.project}-eks-cluster"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  count = var.deployment_mode == "eks" ? 1 : 0

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster[0].name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  count = var.deployment_mode == "eks" ? 1 : 0

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster[0].name
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  count = var.deployment_mode == "eks" ? 1 : 0

  cluster_name    = aws_eks_cluster.main[0].name
  node_group_name = "${var.project}-nodes"
  node_role_arn   = aws_iam_role.eks_nodes[0].arn
  subnet_ids      = [aws_subnet.eks_private_a[0].id, aws_subnet.eks_private_b[0].id]

  scaling_config {
    desired_size = var.node_desired_size
    max_size     = var.node_max_size
    min_size     = var.node_min_size
  }

  instance_types = var.node_instance_types

  depends_on = [
    aws_iam_role_policy_attachment.workers_eks[0]
  ]

  tags = {
    Name = "${var.project}-node-group"
  }
}

# EKS Node IAM Role
resource "aws_iam_role" "eks_nodes" {
  count = var.deployment_mode == "eks" ? 1 : 0

  name = "${var.project}-eks-nodes"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "workers_eks" {
  count = var.deployment_mode == "eks" ? 1 : 0

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes[0].name
}

resource "aws_iam_role_policy_attachment" "workers_cni" {
  count = var.deployment_mode == "eks" ? 1 : 0

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes[0].name
}

resource "aws_iam_role_policy_attachment" "workers_ecr_read" {
  count = var.deployment_mode == "eks" ? 1 : 0

  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes[0].name
}

# EBS CSI Driver IAM
resource "aws_iam_role" "ebs_csi" {
  count = var.deployment_mode == "eks" ? 1 : 0

  name = "${var.project}-ebs-csi"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "pods.eks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ebs_csi" {
  count = var.deployment_mode == "eks" ? 1 : 0

  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi[0].name
}

# EKS OIDC Provider（Helm/IRSA 用）
resource "aws_iam_openid_connect_provider" "eks" {
  count = var.deployment_mode == "eks" ? 1 : 0

  url = aws_eks_cluster.main[0].identity[0].oidc[0].issuer

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = [data.tls_certificate.eks[0].certificates[0].sha1_fingerprint]
}

# TLS Certificate Data Source for EKS OIDC
data "tls_certificate" "eks" {
  count = var.deployment_mode == "eks" ? 1 : 0

  url = aws_eks_cluster.main[0].identity[0].oidc[0].issuer
}

# ============================================
# 共享资源（两种模式都创建）
# ============================================

# ECR 镜像仓库（两种模式都需要）
resource "aws_ecr_repository" "frontend" {
  name = "${var.project}-frontend"
}

resource "aws_ecr_repository" "backend" {
  name = "${var.project}-backend"
}

# Route53 域名（可选）
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "${var.project}-zone"
  }
}