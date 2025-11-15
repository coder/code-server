# EC2 Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for EC2 instances"
  type        = list(string)
}

variable "alb_subnet_ids" {
  description = "List of subnet IDs for ALB"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for EC2 instances"
  type        = string
}

variable "alb_security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "iam_instance_profile_name" {
  description = "IAM instance profile name for EC2 instances"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of KMS key for EBS encryption"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances (leave empty for latest Amazon Linux 2023)"
  type        = string
  default     = ""
}

variable "ebs_volume_size" {
  description = "Size of EBS volume in GB"
  type        = number
  default     = 50
}

variable "ebs_volume_type" {
  description = "Type of EBS volume"
  type        = string
  default     = "gp3"
}

variable "min_instances" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 3
}

variable "desired_instances" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 1
}

variable "code_server_version" {
  description = "Version of code-server to install"
  type        = string
  default     = "latest"
}

variable "code_server_password" {
  description = "Password for code-server (leave empty for auto-generated)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

variable "internal_alb" {
  description = "Whether the ALB should be internal"
  type        = bool
  default     = true
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for ALB"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "enable_autoscaling" {
  description = "Enable auto scaling based on CPU metrics"
  type        = bool
  default     = true
}

# OAuth2 Proxy variables
variable "oauth2_client_id" {
  description = "OAuth2 client ID"
  type        = string
}

variable "oauth2_client_secret" {
  description = "OAuth2 client secret"
  type        = string
  sensitive   = true
}

variable "oauth2_issuer_url" {
  description = "OAuth2 issuer URL (OIDC/SAML endpoint)"
  type        = string
}

variable "oauth2_redirect_url" {
  description = "OAuth2 redirect URL"
  type        = string
}

variable "oauth2_cookie_secret" {
  description = "OAuth2 cookie secret (generate with: python -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())')"
  type        = string
  sensitive   = true
}

variable "oauth2_allowed_emails" {
  description = "List of allowed email addresses for OAuth2"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
