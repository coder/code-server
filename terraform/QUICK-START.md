# Code-Server AWS Deployment - Quick Start

This is a condensed guide to get code-server running on AWS quickly. For detailed documentation, see [README.md](README.md).

## Prerequisites

- AWS Account with credentials configured
- Terraform >= 1.0
- AWS CLI
- kubectl and Helm (for EKS deployment)
- SAML/OIDC Provider configured (Okta, Azure AD, Google, etc.)

## 5-Minute EC2 Setup

### 1. Configure Variables

```bash
cd deployments/ec2
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with minimum required values:

```hcl
aws_region = "us-east-1"

# OAuth2/SAML Configuration
oauth2_client_id     = "your-client-id"
oauth2_client_secret = "your-client-secret"
oauth2_issuer_url    = "https://your-idp.com/.well-known/openid-configuration"
oauth2_redirect_url  = "https://code-server.example.com/oauth2/callback"
oauth2_cookie_secret = "run: python -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())'"
```

### 2. Deploy

```bash
../../scripts/deploy-ec2.sh
```

### 3. Get Access URL

```bash
terraform output alb_url
```

### 4. Get Password

```bash
aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw code_server_password_secret_arn) \
  --query SecretString --output text
```

## 10-Minute EKS Setup

### 1. Configure Variables

```bash
cd deployments/eks
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
aws_region = "us-east-1"

# OAuth2/SAML Configuration
oauth2_client_id     = "your-client-id"
oauth2_client_secret = "your-client-secret"
oauth2_cookie_secret = "generate-random-secret"
```

Edit `k8s/code-server-values.yaml`:

```yaml
ingress:
  hosts:
    - host: code-server.example.com
```

Edit `k8s/oauth2-proxy.yaml`:

```yaml
data:
  oauth2_proxy.cfg: |
    redirect_url = "https://code-server.example.com/oauth2/callback"
    oidc_issuer_url = "https://your-idp.com"
```

### 2. Deploy

```bash
../../scripts/deploy-eks.sh
```

### 3. Get Load Balancer URL

```bash
kubectl get ingress -n code-server
```

## Common Commands

### EC2

```bash
# View logs
aws logs tail /aws/ec2/code-server-dev-code-server --follow

# Scale instances
terraform apply -var="desired_instances=3"

# Destroy
../../scripts/destroy-ec2.sh
```

### EKS

```bash
# View pods
kubectl get pods -n code-server

# View logs
kubectl logs -n code-server -l app.kubernetes.io/name=code-server -f

# Scale pods
kubectl scale deployment code-server -n code-server --replicas=3

# Destroy
../../scripts/destroy-eks.sh
```

## Generate Cookie Secret

```bash
python -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())'
```

Or:

```bash
openssl rand -base64 32
```

## SAML/OIDC Provider Quick Links

### Okta

```hcl
oauth2_issuer_url = "https://<tenant>.okta.com/.well-known/openid-configuration"
```

### Azure AD

```hcl
oauth2_issuer_url = "https://login.microsoftonline.com/<tenant-id>/v2.0/.well-known/openid-configuration"
```

### Google

```hcl
oauth2_issuer_url = "https://accounts.google.com/.well-known/openid-configuration"
```

## Troubleshooting

### Can't access code-server

1. Check security group allows your IP
2. Verify ALB is healthy: `aws elbv2 describe-target-health --target-group-arn <arn>`
3. Check logs for errors

### Authentication fails

1. Verify redirect URL matches IdP configuration exactly
2. Check client ID and secret are correct
3. View OAuth2 Proxy logs for detailed error messages

### Pods not starting (EKS)

1. Check events: `kubectl get events -n code-server --sort-by='.lastTimestamp'`
2. Check pod status: `kubectl describe pod <pod> -n code-server`
3. Verify nodes have capacity: `kubectl top nodes`

## Cost Estimate

### EC2 (t3.medium, 1 instance)

- EC2: ~$30/month
- ALB: ~$20/month
- NAT Gateway: ~$32/month
- EBS: ~$5/month
- **Total: ~$87/month**

### EKS (t3.medium, 2 nodes)

- EKS Control Plane: ~$73/month
- EC2 Nodes: ~$60/month
- ALB: ~$20/month
- NAT Gateway: ~$32/month
- EBS: ~$10/month
- **Total: ~$195/month**

### Cost Optimization

- Use single NAT gateway: Save ~$32-64/month
- Use SPOT instances (EKS): Save up to 90% on compute
- Scale to zero during off-hours: Save on compute costs
- Use GP3 instead of GP2: Save ~20% on storage

## Next Steps

1. Configure DNS (CNAME to ALB DNS)
2. Set up ACM certificate for HTTPS
3. Configure auto-scaling policies
4. Set up CloudWatch alarms
5. Review and adjust security groups
6. Configure backup/snapshot policies

## Full Documentation

- [Complete README](README.md) - Detailed deployment guide
- [SAML Setup Guide](SAML-SETUP-GUIDE.md) - IdP configuration
- [Code-Server Docs](https://coder.com/docs/code-server) - Code-Server features

## Support

For issues:
1. Check [Troubleshooting](README.md#troubleshooting) in README
2. Review CloudWatch logs
3. Check AWS service health dashboard
