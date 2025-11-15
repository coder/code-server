# Code-Server AWS Deployment with Terraform

This repository contains Terraform code to deploy [code-server](https://github.com/coder/code-server) on AWS using either **EC2** or **EKS**, with private networking, security hardening, and SAML authentication.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [EC2 Deployment](#ec2-deployment)
  - [EKS Deployment](#eks-deployment)
- [Configuration](#configuration)
- [SAML/OIDC Authentication](#samloidc-authentication)
- [Security Features](#security-features)
- [Deployment Procedures](#deployment-procedures)
- [Rollout and Updates](#rollout-and-updates)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)
- [Cleanup](#cleanup)

## Overview

This Terraform configuration provides two deployment options for code-server:

1. **EC2 Deployment**: Code-server running on Auto Scaling EC2 instances behind an Application Load Balancer
2. **EKS Deployment**: Code-server running on Amazon EKS (Kubernetes) with Helm charts

Both deployments include:
- Private networking with VPC, subnets, and NAT gateways
- SAML/OIDC authentication via OAuth2 Proxy
- HTTPS support with ACM certificates
- Encryption at rest using AWS KMS
- Auto-scaling capabilities
- CloudWatch logging and monitoring
- Security hardening following AWS best practices

## Architecture

### EC2 Architecture

```
Internet → ALB (HTTPS) → OAuth2 Proxy → Code-Server (EC2 Auto Scaling)
                ↓                           ↓
           Private Subnets              Private Subnets
                ↓                           ↓
           NAT Gateway                  VPC Endpoints
                ↓
              IGW
```

### EKS Architecture

```
Internet → ALB Ingress → OAuth2 Proxy Pod → Code-Server Pods
                ↓                               ↓
           EKS Cluster                      EKS Nodes
                ↓                               ↓
           Private Subnets                 Private Subnets
                ↓                               ↓
           NAT Gateway                      VPC Endpoints
                ↓
              IGW
```

## Features

- **Private Network Setup**: All compute resources in private subnets
- **SAML/OIDC Authentication**: OAuth2 Proxy for enterprise SSO integration
- **High Availability**: Multi-AZ deployment with auto-scaling
- **Security**:
  - Encryption at rest (KMS)
  - Encryption in transit (TLS)
  - IAM roles with least privilege
  - Security groups with minimal ingress
  - VPC Flow Logs
  - IMDSv2 required
- **Monitoring**: CloudWatch Logs and Metrics
- **Infrastructure as Code**: Full Terraform automation
- **Cost Optimized**: Options for single NAT gateway and SPOT instances

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
   ```bash
   aws configure
   ```
3. **Terraform** >= 1.0 installed
   ```bash
   # Install via brew (macOS)
   brew install terraform

   # Or download from https://www.terraform.io/downloads
   ```
4. **kubectl** (for EKS deployment)
   ```bash
   brew install kubectl
   ```
5. **Helm** (for EKS deployment)
   ```bash
   brew install helm
   ```
6. **ACM Certificate** (optional, for HTTPS)
   - Request a certificate in AWS Certificate Manager
   - Validate domain ownership
   - Note the certificate ARN

7. **SAML/OIDC Provider** configured (e.g., Okta, Azure AD, Google Workspace)

## Quick Start

### EC2 Deployment

1. **Navigate to EC2 deployment directory:**
   ```bash
   cd deployments/ec2
   ```

2. **Copy and configure variables:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   vim terraform.tfvars  # Edit with your values
   ```

3. **Deploy using the automated script:**
   ```bash
   ../../scripts/deploy-ec2.sh
   ```

   Or manually:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Get the code-server password:**
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id $(terraform output -raw code_server_password_secret_arn) \
     --query SecretString \
     --output text
   ```

5. **Access code-server:**
   ```bash
   echo $(terraform output -raw alb_url)
   # Navigate to this URL in your browser
   ```

### EKS Deployment

1. **Navigate to EKS deployment directory:**
   ```bash
   cd deployments/eks
   ```

2. **Copy and configure variables:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   vim terraform.tfvars  # Edit with your values
   ```

3. **Deploy using the automated script:**
   ```bash
   ../../scripts/deploy-eks.sh
   ```

   This script will:
   - Deploy EKS infrastructure
   - Configure kubectl
   - Install AWS Load Balancer Controller
   - Deploy code-server (optional)
   - Deploy OAuth2 Proxy (optional)

4. **Manual deployment alternative:**
   ```bash
   # Deploy infrastructure
   terraform init
   terraform plan
   terraform apply

   # Configure kubectl
   aws eks update-kubeconfig --region <region> --name <cluster-name>

   # Deploy code-server
   helm upgrade --install code-server ../../ci/helm-chart \
     --namespace code-server \
     --create-namespace \
     --values k8s/code-server-values.yaml

   # Deploy OAuth2 Proxy
   kubectl apply -f k8s/oauth2-proxy.yaml
   ```

5. **Get the Load Balancer URL:**
   ```bash
   kubectl get ingress -n code-server
   # Wait for ADDRESS field to be populated
   ```

## Configuration

### Key Configuration Files

#### EC2 Deployment

- `deployments/ec2/terraform.tfvars` - Main configuration
- `modules/ec2/user-data.sh` - EC2 initialization script

Important variables:

```hcl
# Network
vpc_cidr             = "10.0.0.0/16"
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# Security
allowed_cidr_blocks = ["10.0.0.0/8"]  # Restrict access
internal_alb        = true             # Private load balancer

# OAuth2/SAML
oauth2_issuer_url    = "https://your-idp.com/.well-known/openid-configuration"
oauth2_client_id     = "your-client-id"
oauth2_client_secret = "your-client-secret"
oauth2_redirect_url  = "https://code-server.example.com/oauth2/callback"

# Generate cookie secret
oauth2_cookie_secret = "run: python -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())'"
```

#### EKS Deployment

- `deployments/eks/terraform.tfvars` - Main configuration
- `deployments/eks/k8s/code-server-values.yaml` - Helm values
- `deployments/eks/k8s/oauth2-proxy.yaml` - OAuth2 Proxy manifest

Important Helm values:

```yaml
# k8s/code-server-values.yaml
ingress:
  enabled: true
  ingressClassName: "alb"
  annotations:
    alb.ingress.kubernetes.io/scheme: internal
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...

persistence:
  enabled: true
  storageClass: "gp3"
  size: 20Gi

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 4Gi
```

## SAML/OIDC Authentication

This deployment uses OAuth2 Proxy to provide SAML/OIDC authentication.

### Supported Providers

- Okta
- Azure Active Directory
- Google Workspace
- AWS SSO (IAM Identity Center)
- Any OIDC-compliant provider

### Configuration Steps

1. **Configure your Identity Provider:**

   **For Okta:**
   ```
   Application Type: Web
   Sign-in redirect URIs: https://code-server.example.com/oauth2/callback
   Sign-out redirect URIs: https://code-server.example.com
   Grant types: Authorization Code, Refresh Token
   ```

   **For Azure AD:**
   ```
   Platform: Web
   Redirect URI: https://code-server.example.com/oauth2/callback
   Supported account types: Single tenant or Multi-tenant
   ```

2. **Get OIDC Discovery URL:**

   Usually in format:
   - Okta: `https://<tenant>.okta.com/.well-known/openid-configuration`
   - Azure AD: `https://login.microsoftonline.com/<tenant-id>/v2.0/.well-known/openid-configuration`
   - Google: `https://accounts.google.com/.well-known/openid-configuration`

3. **Configure Terraform variables:**
   ```hcl
   oauth2_issuer_url    = "<OIDC_DISCOVERY_URL>"
   oauth2_client_id     = "<CLIENT_ID>"
   oauth2_client_secret = "<CLIENT_SECRET>"
   oauth2_redirect_url  = "https://code-server.example.com/oauth2/callback"
   ```

4. **Restrict access by email (optional):**
   ```hcl
   oauth2_allowed_emails = [
     "user1@company.com",
     "user2@company.com"
   ]
   ```

### Testing Authentication

1. Access your code-server URL
2. You should be redirected to your IdP login page
3. After successful authentication, you'll be redirected back to code-server
4. OAuth2 Proxy validates the session and proxies requests to code-server

## Security Features

### Network Security

- **Private Subnets**: All compute resources in private subnets
- **NAT Gateway**: Outbound internet access without public IPs
- **Security Groups**: Minimal ingress rules
- **VPC Flow Logs**: Network traffic monitoring
- **Internal ALB Option**: Keep load balancer private

### Encryption

- **At Rest**: KMS encryption for EBS volumes and EKS secrets
- **In Transit**: TLS for all external connections
- **Secrets**: AWS Secrets Manager for code-server password

### IAM

- **Least Privilege**: Minimal IAM permissions
- **IRSA** (EKS): IAM Roles for Service Accounts
- **Instance Profiles**: Role-based access for EC2

### Compliance

- **IMDSv2 Required**: Enhanced EC2 metadata security
- **Encrypted Storage**: All data encrypted at rest
- **Audit Logs**: CloudWatch and VPC Flow Logs

## Deployment Procedures

### Initial Deployment

1. **Prepare Configuration:**
   ```bash
   cd deployments/<ec2|eks>
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Review Plan:**
   ```bash
   terraform init
   terraform plan
   # Review all resources to be created
   ```

3. **Apply Configuration:**
   ```bash
   terraform apply
   # Type 'yes' to confirm
   ```

4. **Verify Deployment:**
   ```bash
   # EC2
   aws autoscaling describe-auto-scaling-groups \
     --auto-scaling-group-names <asg-name>

   # EKS
   kubectl get pods -n code-server
   kubectl get ingress -n code-server
   ```

### DNS Configuration

1. **Get Load Balancer DNS:**
   ```bash
   # EC2
   terraform output alb_dns_name

   # EKS
   kubectl get ingress -n code-server -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}'
   ```

2. **Create DNS Record:**
   ```
   Type: CNAME
   Name: code-server.example.com
   Value: <alb-dns-name>
   TTL: 300
   ```

3. **Update Configuration:**
   ```hcl
   # Update oauth2_redirect_url with actual domain
   oauth2_redirect_url = "https://code-server.example.com/oauth2/callback"
   ```

4. **Reapply:**
   ```bash
   terraform apply
   ```

## Rollout and Updates

### Update Code-Server Version

**EC2:**
```bash
# Update version in terraform.tfvars
code_server_version = "4.19.0"

# Apply changes (will trigger rolling update)
terraform apply

# Monitor Auto Scaling Group
aws autoscaling describe-auto-scaling-instances
```

**EKS:**
```bash
# Update version in k8s/code-server-values.yaml
image:
  tag: "4.19.0"

# Perform rolling update
helm upgrade code-server ../../ci/helm-chart \
  --namespace code-server \
  --values k8s/code-server-values.yaml \
  --wait

# Monitor rollout
kubectl rollout status deployment/code-server -n code-server
```

### Blue-Green Deployment (EKS)

```bash
# Create new deployment with different name
helm install code-server-blue ../../ci/helm-chart \
  --namespace code-server \
  --values k8s/code-server-values-blue.yaml

# Test the new version
kubectl port-forward -n code-server svc/code-server-blue 8081:8080

# Switch traffic by updating ingress
kubectl apply -f k8s/ingress-blue.yaml

# Delete old deployment
helm uninstall code-server-green -n code-server
```

### Scaling

**EC2:**
```bash
# Update desired capacity
terraform apply -var="desired_instances=3"

# Or use AWS CLI
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name <asg-name> \
  --desired-capacity 3
```

**EKS:**
```bash
# Scale deployment
kubectl scale deployment code-server -n code-server --replicas=3

# Or update Helm values
helm upgrade code-server ../../ci/helm-chart \
  --namespace code-server \
  --set replicaCount=3
```

### Rollback

**EC2:**
```bash
# Terraform doesn't have built-in rollback
# Revert changes in git and reapply
git revert <commit>
terraform apply
```

**EKS:**
```bash
# Helm rollback
helm rollback code-server -n code-server

# Kubernetes rollback
kubectl rollout undo deployment/code-server -n code-server
```

## Monitoring and Logging

### CloudWatch Logs

**EC2:**
```bash
# View logs
aws logs tail /aws/ec2/<prefix>-code-server --follow

# Filter logs
aws logs filter-log-events \
  --log-group-name /aws/ec2/<prefix>-code-server \
  --filter-pattern "ERROR"
```

**EKS:**
```bash
# View pod logs
kubectl logs -n code-server -l app.kubernetes.io/name=code-server --tail=100 -f

# View previous pod logs
kubectl logs -n code-server <pod-name> --previous

# View OAuth2 Proxy logs
kubectl logs -n code-server -l app=oauth2-proxy --tail=100 -f
```

### Metrics

**EC2:**
```bash
# Auto Scaling Group metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=AutoScalingGroupName,Value=<asg-name> \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

**EKS:**
```bash
# Pod metrics (requires metrics-server)
kubectl top pods -n code-server

# Node metrics
kubectl top nodes

# View HPA status
kubectl get hpa -n code-server
```

### Health Checks

**EC2:**
```bash
# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

**EKS:**
```bash
# Check pod health
kubectl get pods -n code-server
kubectl describe pod <pod-name> -n code-server

# Check ingress status
kubectl describe ingress -n code-server
```

## Troubleshooting

### Common Issues

#### EC2: Instances Not Healthy

```bash
# Check Auto Scaling Group
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names <asg-name>

# Check instance logs (via SSM)
aws ssm start-session --target <instance-id>

# View user-data logs
sudo cat /var/log/cloud-init-output.log

# Check Docker containers
sudo docker ps
sudo docker logs code-server
sudo docker logs oauth2-proxy
```

#### EKS: Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n code-server

# Check events
kubectl get events -n code-server --sort-by='.lastTimestamp'

# Check storage
kubectl get pvc -n code-server
kubectl describe pvc <pvc-name> -n code-server

# Check node resources
kubectl describe node <node-name>
```

#### Authentication Not Working

```bash
# EC2: Check OAuth2 Proxy logs
aws logs tail /aws/ec2/<prefix>-code-server \
  --filter-pattern "oauth2-proxy" \
  --follow

# EKS: Check OAuth2 Proxy logs
kubectl logs -n code-server -l app=oauth2-proxy

# Verify configuration
# - Redirect URL matches IdP configuration
# - Client ID and secret are correct
# - Issuer URL is accessible
```

#### Load Balancer Not Accessible

```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# Check ALB status
aws elbv2 describe-load-balancers

# Check target health
aws elbv2 describe-target-health --target-group-arn <arn>

# EKS: Check ingress
kubectl describe ingress -n code-server
```

## Cost Optimization

### Single NAT Gateway

Reduce costs by using a single NAT gateway (not recommended for production):

```hcl
single_nat_gateway = true
```

Savings: ~$32-96/month (depending on region)

### SPOT Instances (EKS)

Use SPOT instances for EKS nodes:

```hcl
capacity_type = "SPOT"
```

Savings: Up to 90% on compute costs (with interruption risk)

### Auto Scaling

Configure aggressive scale-down policies:

```hcl
# EC2
min_instances = 0  # Scale to zero during off-hours

# EKS
min_nodes = 0  # Requires cluster autoscaler
```

### Storage Optimization

Use GP3 instead of GP2:

```hcl
ebs_volume_type = "gp3"  # EC2

# EKS
storageClass: "gp3"  # Helm values
```

Savings: ~20% on storage costs

## Cleanup

### EC2

```bash
# Using script
../scripts/destroy-ec2.sh

# Or manually
cd deployments/ec2
terraform destroy
```

### EKS

```bash
# Using script
../scripts/destroy-eks.sh

# Or manually
helm uninstall code-server -n code-server
kubectl delete namespace code-server
cd deployments/eks
terraform destroy
```

**Important**: Terraform destroy will remove all resources including:
- EC2 instances / EKS cluster
- Load balancers
- VPC and networking
- KMS keys (after 7-30 day waiting period)
- CloudWatch logs (based on retention settings)

## Support and Contributing

For issues or questions:
1. Check the [troubleshooting](#troubleshooting) section
2. Review [code-server documentation](https://coder.com/docs/code-server)
3. Check AWS service health dashboard
4. Review CloudWatch logs

## License

This Terraform configuration is provided as-is under the MIT License.

## Additional Resources

- [Code-Server Documentation](https://coder.com/docs/code-server)
- [OAuth2 Proxy Documentation](https://oauth2-proxy.github.io/oauth2-proxy/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
