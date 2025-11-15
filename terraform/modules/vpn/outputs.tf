# VPN Module Outputs

output "vpn_endpoint_id" {
  description = "ID of the Client VPN endpoint"
  value       = aws_ec2_client_vpn_endpoint.main.id
}

output "vpn_endpoint_arn" {
  description = "ARN of the Client VPN endpoint"
  value       = aws_ec2_client_vpn_endpoint.main.arn
}

output "vpn_endpoint_dns_name" {
  description = "DNS name of the Client VPN endpoint"
  value       = aws_ec2_client_vpn_endpoint.main.dns_name
}

output "vpn_security_group_id" {
  description = "ID of the VPN security group"
  value       = aws_security_group.vpn.id
}

output "client_cidr_block" {
  description = "CIDR block assigned to VPN clients"
  value       = var.client_cidr_block
}

output "vpn_endpoint_status" {
  description = "Status of the Client VPN endpoint"
  value       = aws_ec2_client_vpn_endpoint.main.status
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group for VPN connections"
  value       = aws_cloudwatch_log_group.vpn.name
}
