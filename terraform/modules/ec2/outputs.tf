# EC2 Module Outputs

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.code_server.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.code_server.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.code_server.zone_id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.code_server.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.code_server.arn
}

output "launch_template_id" {
  description = "ID of the Launch Template"
  value       = aws_launch_template.code_server.id
}

output "code_server_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing code-server password"
  value       = aws_secretsmanager_secret.code_server_password.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.code_server.name
}
