# EC2 Deployment Variables

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
  description = "CIDR blocks allowed to SSH into instances"
  type        = list(string)
  default     = []  # No SSH access by default
}

# EC2 Configuration
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "ebs_volume_size" {
  description = "Size of EBS volume in GB"
  type        = number
  default     = 50
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 3
}

variable "desired_instances" {
  description = "Desired number of instances"
  type        = number
  default     = 1
}

variable "code_server_version" {
  description = "Version of code-server Docker image"
  type        = string
  default     = "latest"
}

variable "enable_autoscaling" {
  description = "Enable auto scaling"
  type        = bool
  default     = true
}

# Load Balancer Configuration
variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS (leave empty to use HTTP)"
  type        = string
  default     = ""
}

variable "internal_alb" {
  description = "Whether the ALB should be internal (private network only)"
  type        = bool
  default     = true
}

# OAuth2 / SAML Configuration
variable "oauth2_client_id" {
  description = "OAuth2 client ID from your SAML/OIDC provider"
  type        = string
}

variable "oauth2_client_secret" {
  description = "OAuth2 client secret from your SAML/OIDC provider"
  type        = string
  sensitive   = true
}

variable "oauth2_issuer_url" {
  description = "OAuth2 issuer URL (OIDC discovery endpoint)"
  type        = string
}

variable "oauth2_redirect_url" {
  description = "OAuth2 redirect URL (https://your-domain.com/oauth2/callback)"
  type        = string
}

variable "oauth2_cookie_secret" {
  description = "OAuth2 cookie secret (generate with: python -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())')"
  type        = string
  sensitive   = true
}

variable "oauth2_allowed_emails" {
  description = "List of allowed email addresses (leave empty to allow all)"
  type        = list(string)
  default     = []
}

# VPN Configuration
variable "enable_vpn" {
  description = "Enable AWS Client VPN for secure access"
  type        = bool
  default     = false
}

variable "vpn_server_certificate_arn" {
  description = "ARN of server certificate in ACM for VPN"
  type        = string
  default     = ""
}

variable "vpn_client_certificate_arn" {
  description = "ARN of client root certificate in ACM for VPN"
  type        = string
  default     = ""
}

variable "vpn_client_cidr_block" {
  description = "CIDR block for VPN clients (must not overlap with VPC)"
  type        = string
  default     = "172.16.0.0/22"
}

variable "vpn_split_tunnel" {
  description = "Enable split tunnel (only route VPC traffic through VPN)"
  type        = bool
  default     = true
}

variable "vpn_authentication_type" {
  description = "VPN authentication type (certificate-authentication recommended)"
  type        = string
  default     = "certificate-authentication"
}

variable "vpn_dns_servers" {
  description = "DNS servers for VPN clients (leave empty to use VPC DNS)"
  type        = list(string)
  default     = []
}

variable "vpn_transport_protocol" {
  description = "VPN transport protocol (udp recommended for better performance)"
  type        = string
  default     = "udp"
}

variable "vpn_port" {
  description = "VPN port (443 or 1194)"
  type        = number
  default     = 443
}

variable "vpn_session_timeout_hours" {
  description = "VPN session timeout in hours (8-24)"
  type        = number
  default     = 24
}

variable "vpn_client_login_banner" {
  description = "Banner text to display on VPN client login"
  type        = string
  default     = "Welcome to Code-Server VPN. Authorized access only."
}
