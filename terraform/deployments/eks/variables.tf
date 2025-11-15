# EKS Deployment Variables

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "code-server"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "single_nat_gateway" {
  description = "Use a single NAT gateway (cost optimization)"
  type        = bool
  default     = false
}

# Security Configuration
variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the ALB"
  type        = list(string)
  default     = ["10.0.0.0/8"]  # Restrict to private network
}

variable "ssh_allowed_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into nodes"
  type        = list(string)
  default     = []  # No SSH access by default
}

# EKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "endpoint_public_access" {
  description = "Enable public access to EKS API endpoint"
  type        = bool
  default     = false
}

variable "public_access_cidrs" {
  description = "CIDR blocks allowed to access EKS API endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "node_instance_types" {
  description = "Instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "capacity_type" {
  description = "Capacity type for EKS nodes (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
}

variable "node_disk_size" {
  description = "Disk size for EKS nodes in GB"
  type        = number
  default     = 50
}

variable "min_nodes" {
  description = "Minimum number of EKS nodes"
  type        = number
  default     = 1
}

variable "max_nodes" {
  description = "Maximum number of EKS nodes"
  type        = number
  default     = 3
}

variable "desired_nodes" {
  description = "Desired number of EKS nodes"
  type        = number
  default     = 2
}

# OAuth2 / SAML Configuration
variable "deploy_oauth2_proxy" {
  description = "Deploy OAuth2 Proxy for authentication"
  type        = bool
  default     = true
}

variable "oauth2_client_id" {
  description = "OAuth2 client ID from your SAML/OIDC provider"
  type        = string
  default     = ""
}

variable "oauth2_client_secret" {
  description = "OAuth2 client secret from your SAML/OIDC provider"
  type        = string
  sensitive   = true
  default     = ""
}

variable "oauth2_cookie_secret" {
  description = "OAuth2 cookie secret (generate with: python -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())')"
  type        = string
  sensitive   = true
  default     = ""
}
