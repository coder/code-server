# EC2 Deployment Configuration for Code-Server
# This file creates all necessary infrastructure to deploy code-server on EC2

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Uncomment and configure for remote state storage
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "code-server/ec2/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "code-server"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Deployment  = "EC2"
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  cluster_name = "${local.name_prefix}-eks"  # Used for VPC subnet tagging

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Deployment  = "EC2"
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  name_prefix            = local.name_prefix
  vpc_cidr               = var.vpc_cidr
  public_subnet_cidrs    = var.public_subnet_cidrs
  private_subnet_cidrs   = var.private_subnet_cidrs
  aws_region             = var.aws_region
  cluster_name           = local.cluster_name
  enable_nat_gateway     = true
  single_nat_gateway     = var.single_nat_gateway
  enable_vpc_endpoints   = true
  enable_flow_logs       = true
  flow_logs_retention_days = 30

  tags = local.common_tags
}

# Security Module
module "security" {
  source = "../../modules/security"

  name_prefix              = local.name_prefix
  vpc_id                   = module.vpc.vpc_id
  allowed_cidr_blocks      = var.allowed_cidr_blocks
  ssh_allowed_cidr_blocks  = var.ssh_allowed_cidr_blocks

  tags = local.common_tags
}

# EC2 Module for Code-Server
module "code_server_ec2" {
  source = "../../modules/ec2"

  name_prefix                = local.name_prefix
  vpc_id                     = module.vpc.vpc_id
  subnet_ids                 = module.vpc.private_subnet_ids
  alb_subnet_ids             = var.internal_alb ? module.vpc.private_subnet_ids : module.vpc.public_subnet_ids
  security_group_id          = module.security.code_server_ec2_security_group_id
  alb_security_group_id      = module.security.alb_security_group_id
  iam_instance_profile_name  = module.security.code_server_ec2_instance_profile_name
  kms_key_arn                = module.security.kms_key_arn
  aws_region                 = var.aws_region

  instance_type              = var.instance_type
  ebs_volume_size            = var.ebs_volume_size
  min_instances              = var.min_instances
  max_instances              = var.max_instances
  desired_instances          = var.desired_instances
  code_server_version        = var.code_server_version
  certificate_arn            = var.certificate_arn
  internal_alb               = var.internal_alb
  enable_autoscaling         = var.enable_autoscaling

  # OAuth2 Proxy Configuration
  oauth2_client_id           = var.oauth2_client_id
  oauth2_client_secret       = var.oauth2_client_secret
  oauth2_issuer_url          = var.oauth2_issuer_url
  oauth2_redirect_url        = var.oauth2_redirect_url
  oauth2_cookie_secret       = var.oauth2_cookie_secret
  oauth2_allowed_emails      = var.oauth2_allowed_emails

  tags = local.common_tags
}
