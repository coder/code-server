# VPN Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs to associate with VPN endpoint"
  type        = list(string)
}

variable "server_certificate_arn" {
  description = "ARN of the server certificate in ACM"
  type        = string
}

variable "client_certificate_arn" {
  description = "ARN of the client root certificate in ACM (for certificate authentication)"
  type        = string
  default     = ""
}

variable "client_cidr_block" {
  description = "CIDR block for VPN clients"
  type        = string
  default     = "172.16.0.0/22"
}

variable "split_tunnel" {
  description = "Enable split tunnel (only route VPC traffic through VPN)"
  type        = bool
  default     = true
}

variable "authentication_type" {
  description = "Authentication type (certificate-authentication, directory-service-authentication, or federated-authentication)"
  type        = string
  default     = "certificate-authentication"

  validation {
    condition     = contains(["certificate-authentication", "directory-service-authentication", "federated-authentication"], var.authentication_type)
    error_message = "Authentication type must be certificate-authentication, directory-service-authentication, or federated-authentication."
  }
}

variable "active_directory_id" {
  description = "ID of Active Directory (for directory-service-authentication)"
  type        = string
  default     = null
}

variable "enable_saml_authentication" {
  description = "Enable SAML-based federated authentication as second factor"
  type        = bool
  default     = false
}

variable "saml_provider_arn" {
  description = "ARN of the SAML provider (for federated-authentication)"
  type        = string
  default     = null
}

variable "self_service_saml_provider_arn" {
  description = "ARN of the IAM SAML identity provider for self-service portal"
  type        = string
  default     = null
}

variable "dns_servers" {
  description = "DNS servers for VPN clients"
  type        = list(string)
  default     = []
}

variable "transport_protocol" {
  description = "Transport protocol (tcp or udp)"
  type        = string
  default     = "udp"

  validation {
    condition     = contains(["tcp", "udp"], var.transport_protocol)
    error_message = "Transport protocol must be tcp or udp."
  }
}

variable "vpn_port" {
  description = "VPN port (443 or 1194)"
  type        = number
  default     = 443

  validation {
    condition     = contains([443, 1194], var.vpn_port)
    error_message = "VPN port must be 443 or 1194."
  }
}

variable "session_timeout_hours" {
  description = "Maximum VPN session duration in hours (8-24)"
  type        = number
  default     = 24

  validation {
    condition     = var.session_timeout_hours >= 8 && var.session_timeout_hours <= 24
    error_message = "Session timeout must be between 8 and 24 hours."
  }
}

variable "authorize_all_groups" {
  description = "Authorize all groups for VPC access"
  type        = bool
  default     = true
}

variable "access_group_id" {
  description = "Access group ID for authorization (Active Directory group)"
  type        = string
  default     = null
}

variable "additional_authorization_rules" {
  description = "Additional authorization rules for specific CIDRs"
  type = list(object({
    cidr                 = string
    authorize_all_groups = bool
    access_group_id      = string
    description          = string
  }))
  default = []
}

variable "additional_routes" {
  description = "Additional routes for VPN clients"
  type = list(object({
    cidr        = string
    description = string
  }))
  default = []
}

variable "log_retention_days" {
  description = "Number of days to retain VPN connection logs"
  type        = number
  default     = 30
}

variable "enable_client_connect_handler" {
  description = "Enable client connect handler (Lambda function for custom authorization)"
  type        = bool
  default     = false
}

variable "client_connect_lambda_arn" {
  description = "ARN of Lambda function for client connect handler"
  type        = string
  default     = null
}

variable "client_login_banner" {
  description = "Text to display in client login banner"
  type        = string
  default     = ""
}

variable "vpn_ingress_cidr_blocks" {
  description = "CIDR blocks allowed to connect to VPN"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "apply_security_group" {
  description = "Apply security group to VPN endpoint"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
