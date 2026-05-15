terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.20"
    }
  }

  backend "s3" {
    bucket = "km-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

provider "aws" {
  region = "ap-northeast-1"

  default_tags {
    tags = {
      Project     = "KnowledgeManagement"
      Environment = "production"
      ManagedBy   = "Terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = "ap-northeast-1"
  vpc_cidr   = "10.0.0.0/16"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "km-vpc"
  cidr = local.vpc_cidr

  azs             = ["${local.region}a", "${local.region}c", "${local.region}d"]
  private_subnets  = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  public_subnets   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  database_subnets = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false

  tags = {
    Name = "km-vpc"
  }
}

module "ecs_cluster" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "~> 8.0"

  cluster_name = "km-cluster"

  cluster_configuration = {
    execute_command_configuration = {
      log_configuration = {
        cloud_watch_log_group_name = "/aws/ecs/km-cluster"
      }
    }
  }

  cluster_settings = [{
    name  = "containerInsights"
    value = "enabled"
  }]

  cluster_tags = {
    Project = "KnowledgeManagement"
  }
}

module "ecs_services" {
  source  = "terraform-aws-modules/ecs/aws//modules/ecs-service"
  version = "~> 8.0"

  for_each = toset(["auth-service", "search-service", "graph-service", "document-service", "chat-service"])

  cluster_name  = module.ecs_cluster.cluster_name
  service_name  = each.value
  desired_count = 2
  task_definition_arn = module.ecs_tasks[each.value].task_definition_arn

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  subnets = module.vpc.private_subnets

  load_balancer = {
    target_group_arn = module.alb.target_groups[each.value].arn
    container_name   = each.value
    container_port   = 8080
  }

  security_group_rules = {
    alb = {
      type                     = "ingress"
      source_security_group_id = module.alb.security_group_id
      ports = [{
        from_port = 8080
        to_port   = 8080
        protocol  = "tcp"
      }]
    }
  }
}

module "albs" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name = "km-alb"

  vpc_id     = module.vpc.vpc_id
  subnets    = module.vpc.public_subnets
  security_groups = [module.alb_security_group.security_group_id]

  target_groups = {
    for service in ["auth-service", "search-service", "graph-service", "document-service", "chat-service"] : service => {
      name     = "${service}-tg"
      protocol = "HTTP"
      port     = 80
      health_check = {
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
  }

  listeners = {
    http = {
      port     = 80
      protocol = "HTTP"
      forward = {
        target_group_key = "auth-service"
      }
    }
  }
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "km-postgres"

  engine               = "postgres"
  engine_version        = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_encrypted     = true

  db_name  = "kmdb"
  username = "kmadmin"
  password = random_password.rds_password.result

  multi_az               = true
  db_subnet_group_name    = module.vpc.database_subnet_group
  vpc_security_group_ids  = [module.rds_security_group.security_group_id]

  backup_retention_period = 14
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
}

module "opensearch" {
  source  = "terraform-aws-modules/opensearch/aws"
  version = "~> 2.0"

  domain_name = "km-opensearch"

  engine_version = "OpenSearch_2.11"

  cluster_config = {
    instance_type            = "r6g.large.search"
    instance_count          = 3
    dedicated_master_enabled = true
    dedicated_master_type   = "r6g.large.search"
    dedicated_master_count = 3
    warm_enabled           = true
    warm_type              = "ultrawarm1.large.search"
    warm_count             = 2
  }

  vpc_options = {
    security_group_ids = [module.opensearch_security_group.security_group_id]
    subnet_ids         = [module.vpc.private_subnets[0], module.vpc.private_subnets[1]]
  }

  encrypt_at_rest_options = {
    enabled = true
  }

  domain_endpoint_options = {
    enforce HTTPS = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  advanced_options = {
    "rest.action.multi.allow_explicit_index" = "true"
  }
}

module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 3.0"

  identifier = "km-redis"

  cluster_mode_replicas_per_node_group = 1
  number_of_node_groups                = 2
  node_type                            = "cache.r6g.large"

  engine              = "redis"
  engine_version      = "7.1"
  port                = 6379

  at_rest_encryption  = true
  transit_encryption  = true
  auth_token_enabled  = true

  security_group_ids  = [module.redis_security_group.security_group_id]
  subnet_group_name   = aws_elasticache_subnet_group.km_redis.name
}

resource "random_password" "rds_password" {
  length  = 32
  special = true
}

resource "aws_elasticache_subnet_group" "km_redis" {
  name       = "km-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

resource "random_string" "cognito_pool_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "aws_cognito_user_pool" "km_users" {
  name = "km-user-pool-${random_string.cognito_pool_suffix.result}"

  username_attributes    = ["email"]
  alias_attributes      = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  schema = [
    {
      name         = "email"
      attribute_data_type    = "String"
      required       = true
      mutable       = true
    },
    {
      name         = "given_name"
      attribute_data_type    = "String"
      required       = false
      mutable       = true
    },
    {
      name         = "family_name"
      attribute_data_type    = "String"
      required       = false
      mutable       = true
    }
  ]

  tags = {
    Project = "KnowledgeManagement"
  }
}

resource "aws_cognito_user_pool_client" "km_app_client" {
  name         = "km-app-client"
  user_pool_id = aws_cognito_user_pool.km_users.id

  generate_secret     = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows = ["implicit", "code"]
  allowed_oauth_scopes = ["openid", "profile", "email"]
  callback_urls       = ["https://km.example.com/callback"]
  logout_urls        = ["https://km.example.com/logout"]
}

resource "aws_s3_bucket" "km_documents" {
  bucket = "km-documents-${local.account_id}"

  tags = {
    Project = "KnowledgeManagement"
  }
}

resource "aws_s3_bucket_versioning" "km_documents" {
  bucket = aws_s3_bucket.km_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "km_documents" {
  bucket = aws_s3_bucket.km_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}