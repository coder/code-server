# Security Module Outputs

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "code_server_ec2_security_group_id" {
  description = "ID of the Code-Server EC2 security group"
  value       = aws_security_group.code_server_ec2.id
}

output "eks_cluster_security_group_id" {
  description = "ID of the EKS cluster security group"
  value       = aws_security_group.eks_cluster.id
}

output "eks_nodes_security_group_id" {
  description = "ID of the EKS nodes security group"
  value       = aws_security_group.eks_nodes.id
}

output "code_server_ec2_iam_role_arn" {
  description = "ARN of the Code-Server EC2 IAM role"
  value       = aws_iam_role.code_server_ec2.arn
}

output "code_server_ec2_instance_profile_name" {
  description = "Name of the Code-Server EC2 instance profile"
  value       = aws_iam_instance_profile.code_server_ec2.name
}

output "eks_cluster_iam_role_arn" {
  description = "ARN of the EKS cluster IAM role"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_nodes_iam_role_arn" {
  description = "ARN of the EKS nodes IAM role"
  value       = aws_iam_role.eks_nodes.arn
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.code_server.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.code_server.arn
}
