# EC2 Deployment Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.code_server_ec2.alb_dns_name
}

output "alb_url" {
  description = "URL to access Code-Server"
  value       = var.certificate_arn != "" ? "https://${module.code_server_ec2.alb_dns_name}" : "http://${module.code_server_ec2.alb_dns_name}"
}

output "code_server_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing code-server password"
  value       = module.code_server_ec2.code_server_password_secret_arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = module.code_server_ec2.autoscaling_group_name
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = module.security.kms_key_arn
}

output "vpn_endpoint_id" {
  description = "ID of the VPN endpoint (if enabled)"
  value       = var.enable_vpn ? module.vpn[0].vpn_endpoint_id : null
}

output "vpn_endpoint_dns_name" {
  description = "DNS name of the VPN endpoint (if enabled)"
  value       = var.enable_vpn ? module.vpn[0].vpn_endpoint_dns_name : null
}

output "vpn_client_cidr_block" {
  description = "CIDR block for VPN clients (if enabled)"
  value       = var.enable_vpn ? var.vpn_client_cidr_block : null
}

output "next_steps" {
  description = "Next steps to complete the setup"
  value = <<-EOT

    Code-Server EC2 Deployment Complete!

    Next Steps:
    1. Access Code-Server at: ${var.certificate_arn != "" ? "https" : "http"}://${module.code_server_ec2.alb_dns_name}

    2. Get the code-server password:
       aws secretsmanager get-secret-value \
         --secret-id ${module.code_server_ec2.code_server_password_secret_arn} \
         --region ${var.aws_region} \
         --query SecretString \
         --output text

    3. Configure DNS (if using custom domain):
       - Create a CNAME record pointing to: ${module.code_server_ec2.alb_dns_name}
       - Update oauth2_redirect_url with your domain

    4. Monitor the deployment:
       - CloudWatch Logs: /aws/ec2/${local.name_prefix}-code-server
       - Auto Scaling Group: ${module.code_server_ec2.autoscaling_group_name}

    5. For SAML/OIDC authentication:
       - Ensure your IdP is configured with the redirect URL: ${var.oauth2_redirect_url}
       - Verify allowed email addresses are configured

    Security Notes:
    - All instances are in private subnets
    - ALB is ${var.internal_alb ? "internal (private network only)" : "public"}
    - Data is encrypted at rest using KMS
    - VPC Flow Logs are enabled for monitoring
    ${var.enable_vpn ? "\n    VPN Configuration:\n    - VPN Endpoint: ${module.vpn[0].vpn_endpoint_dns_name}\n    - To export VPN configuration: ../../scripts/export-vpn-config.sh ${module.vpn[0].vpn_endpoint_id} ${var.aws_region}\n    - VPN clients will receive IPs from: ${var.vpn_client_cidr_block}" : ""}
  EOT
}
