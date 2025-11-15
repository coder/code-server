# EKS Deployment Outputs

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

output "eks_cluster_id" {
  description = "ID of the EKS cluster"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = module.eks.cluster_arn
}

output "eks_cluster_oidc_issuer_url" {
  description = "OIDC issuer URL of the EKS cluster"
  value       = module.eks.cluster_oidc_issuer_url
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = module.security.kms_key_arn
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_id}"
}

output "next_steps" {
  description = "Next steps to complete the setup"
  value = <<-EOT

    Code-Server EKS Deployment Complete!

    Next Steps:

    1. Configure kubectl to access the cluster:
       ${join("\n       ", [
         "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_id}",
         "kubectl get nodes  # Verify nodes are ready"
       ])}

    2. Deploy Code-Server using Helm:
       ${join("\n       ", [
         "cd k8s",
         "# Edit code-server-values.yaml with your configuration",
         "helm upgrade --install code-server ../../ci/helm-chart \\",
         "  --namespace code-server \\",
         "  --create-namespace \\",
         "  --values code-server-values.yaml"
       ])}

    3. (Optional) Deploy OAuth2 Proxy for SAML authentication:
       ${join("\n       ", [
         "# Edit k8s/oauth2-proxy.yaml with your SAML/OIDC configuration",
         "kubectl apply -f k8s/oauth2-proxy.yaml"
       ])}

    4. Get the Load Balancer URL:
       ${join("\n       ", [
         "kubectl get ingress -n code-server",
         "# Wait for ADDRESS to be populated",
         "# The URL will be in the format: xxxxx.region.elb.amazonaws.com"
       ])}

    5. Configure DNS (if using custom domain):
       ${join("\n       ", [
         "# Create a CNAME record pointing to the ALB DNS name",
         "# Update the ingress configuration with your domain"
       ])}

    6. Monitor the deployment:
       ${join("\n       ", [
         "kubectl get pods -n code-server",
         "kubectl logs -n code-server -l app.kubernetes.io/name=code-server",
         "kubectl describe ingress -n code-server"
       ])}

    Security Notes:
    - All worker nodes are in private subnets
    - EKS API endpoint is ${var.endpoint_public_access ? "public" : "private"}
    - Data is encrypted at rest using KMS
    - VPC Flow Logs are enabled for monitoring
    - IRSA (IAM Roles for Service Accounts) is enabled

    Useful Commands:
    - Scale nodes: kubectl scale deployment code-server -n code-server --replicas=3
    - View logs: kubectl logs -n code-server -f deployment/code-server
    - Port forward (testing): kubectl port-forward -n code-server svc/code-server 8080:8080
  EOT
}
