# EKS Deployment Configuration for Code-Server
# This file creates all necessary infrastructure to deploy code-server on EKS

terraform {
  required_version = ">= 1.0"

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
      version = "~> 2.11"
    }
  }

  # Uncomment and configure for remote state storage
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "code-server/eks/terraform.tfstate"
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
      Deployment  = "EKS"
    }
  }
}

locals {
  name_prefix  = "${var.project_name}-${var.environment}"
  cluster_name = "${local.name_prefix}-eks"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Deployment  = "EKS"
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  name_prefix              = local.name_prefix
  vpc_cidr                 = var.vpc_cidr
  public_subnet_cidrs      = var.public_subnet_cidrs
  private_subnet_cidrs     = var.private_subnet_cidrs
  aws_region               = var.aws_region
  cluster_name             = local.cluster_name
  enable_nat_gateway       = true
  single_nat_gateway       = var.single_nat_gateway
  enable_vpc_endpoints     = true
  enable_flow_logs         = true
  flow_logs_retention_days = 30

  tags = local.common_tags
}

# Security Module
module "security" {
  source = "../../modules/security"

  name_prefix             = local.name_prefix
  vpc_id                  = module.vpc.vpc_id
  allowed_cidr_blocks     = var.allowed_cidr_blocks
  ssh_allowed_cidr_blocks = var.ssh_allowed_cidr_blocks

  tags = local.common_tags
}

# EKS Module
module "eks" {
  source = "../../modules/eks"

  cluster_name               = local.cluster_name
  cluster_role_arn           = module.security.eks_cluster_iam_role_arn
  node_role_arn              = module.security.eks_nodes_iam_role_arn
  private_subnet_ids         = module.vpc.private_subnet_ids
  public_subnet_ids          = module.vpc.public_subnet_ids
  cluster_security_group_id  = module.security.eks_cluster_security_group_id
  kms_key_arn                = module.security.kms_key_arn

  kubernetes_version         = var.kubernetes_version
  endpoint_public_access     = var.endpoint_public_access
  public_access_cidrs        = var.public_access_cidrs

  node_instance_types        = var.node_instance_types
  capacity_type              = var.capacity_type
  node_disk_size             = var.node_disk_size
  min_nodes                  = var.min_nodes
  max_nodes                  = var.max_nodes
  desired_nodes              = var.desired_nodes

  enable_ebs_csi_driver              = true
  enable_irsa                        = true
  enable_aws_load_balancer_controller = true

  tags = local.common_tags
}

# Configure Kubernetes provider
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      module.eks.cluster_id,
      "--region",
      var.aws_region
    ]
  }
}

# Configure Helm provider
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = [
        "eks",
        "get-token",
        "--cluster-name",
        module.eks.cluster_id,
        "--region",
        var.aws_region
      ]
    }
  }
}

# Install AWS Load Balancer Controller
resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = "1.6.2"

  set {
    name  = "clusterName"
    value = module.eks.cluster_id
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.eks.aws_load_balancer_controller_role_arn
  }

  set {
    name  = "region"
    value = var.aws_region
  }

  set {
    name  = "vpcId"
    value = module.vpc.vpc_id
  }

  depends_on = [module.eks]
}

# Create namespace for code-server
resource "kubernetes_namespace" "code_server" {
  metadata {
    name = "code-server"
    labels = {
      name = "code-server"
    }
  }

  depends_on = [module.eks]
}

# Create secret for OAuth2 Proxy
resource "kubernetes_secret" "oauth2_proxy" {
  count = var.deploy_oauth2_proxy ? 1 : 0

  metadata {
    name      = "oauth2-proxy-secrets"
    namespace = kubernetes_namespace.code_server.metadata[0].name
  }

  data = {
    client-id     = var.oauth2_client_id
    client-secret = var.oauth2_client_secret
    cookie-secret = var.oauth2_cookie_secret
  }

  type = "Opaque"
}

# Storage Class for EBS GP3
resource "kubernetes_storage_class" "gp3" {
  metadata {
    name = "gp3"
  }

  storage_provisioner = "ebs.csi.aws.com"
  volume_binding_mode = "WaitForFirstConsumer"

  parameters = {
    type      = "gp3"
    encrypted = "true"
    kmsKeyId  = module.security.kms_key_arn
  }

  depends_on = [module.eks]
}
