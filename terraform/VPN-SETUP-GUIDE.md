# AWS Client VPN Setup Guide for Code-Server

This guide explains how to set up AWS Client VPN to securely access your code-server deployment. With VPN enabled, users must connect to the VPN before accessing code-server, adding an extra layer of security.

## Table of Contents

- [Overview](#overview)
- [Why Use VPN](#why-use-vpn)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup Steps](#setup-steps)
  - [1. Generate VPN Certificates](#1-generate-vpn-certificates)
  - [2. Configure Terraform](#2-configure-terraform)
  - [3. Deploy VPN](#3-deploy-vpn)
  - [4. Export Client Configuration](#4-export-client-configuration)
  - [5. Distribute to Users](#5-distribute-to-users)
- [Client Setup](#client-setup)
- [Testing VPN Connection](#testing-vpn-connection)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
- [Cost Considerations](#cost-considerations)

## Overview

AWS Client VPN is a managed client-based VPN service that enables you to securely access your AWS resources from any location using an OpenVPN-based VPN client.

### Key Features

- **Certificate-based Authentication**: Secure authentication using X.509 certificates
- **Split Tunneling**: Only route VPC traffic through VPN (internet traffic goes direct)
- **Session Logging**: CloudWatch logs for all VPN connections
- **Multi-platform Support**: Works on Windows, macOS, Linux, iOS, and Android
- **High Availability**: AWS managed service with automatic failover

## Why Use VPN

### Security Benefits

1. **Network-Level Access Control**: VPN required before accessing code-server
2. **Hide Internal Infrastructure**: ALB and resources stay completely private
3. **Additional Authentication Layer**: Certificates + OAuth2/SAML = multi-factor
4. **Audit Trail**: All VPN connections logged in CloudWatch
5. **IP Whitelisting Alternative**: No need to manage IP allowlists

### Use Cases

- **Fully Private Deployment**: No public endpoints at all
- **Compliance Requirements**: Meet regulatory requirements for private access
- **Remote Team Access**: Secure access for distributed teams
- **Development Environments**: Keep dev/staging completely isolated

## Architecture

### With VPN Enabled

```
User Device
    ↓
AWS Client VPN Endpoint (Certificate Auth)
    ↓
Private Subnets
    ↓
Internal ALB → OAuth2 Proxy → Code-Server
    ↓
Private EC2/EKS Resources
```

### VPN Network Flow

1. User connects to VPN with client certificate
2. VPN assigns IP from client CIDR (172.16.0.0/22 by default)
3. VPN routes VPC traffic (10.0.0.0/16) through tunnel
4. User accesses internal ALB at private IP
5. OAuth2 Proxy provides SAML/OIDC authentication
6. Code-Server accessible only via VPN

## Prerequisites

- OpenSSL installed (for certificate generation)
- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- IAM permissions to:
  - Create VPN endpoints
  - Import certificates to ACM
  - Create CloudWatch log groups
  - Modify security groups

## Setup Steps

### 1. Generate VPN Certificates

VPN requires server and client certificates for authentication.

```bash
cd terraform/scripts

# Generate certificates (will upload to ACM automatically)
./generate-vpn-certificates.sh [cert-dir] [region] [common-name]

# Example:
./generate-vpn-certificates.sh ./vpn-certs us-east-1 code-server-vpn
```

This script:
1. Creates a Certificate Authority (CA)
2. Generates server certificate
3. Generates client certificate
4. Uploads both to AWS Certificate Manager
5. Outputs certificate ARNs for Terraform

**Output Files:**
- `ca.key` - CA private key (keep secure!)
- `ca.crt` - CA certificate
- `server.key` - Server private key (keep secure!)
- `server.crt` - Server certificate
- `client.key` - Client private key (distribute to users)
- `client.crt` - Client certificate (distribute to users)
- `certificate-arns.txt` - ARNs for Terraform
- `terraform-vars.txt` - Terraform configuration snippet

**Security Note:**
- Store `ca.key` and `server.key` securely (never share these!)
- Back up all certificates securely
- Distribute `client.key` and `client.crt` to authorized users only

### 2. Configure Terraform

Edit your `terraform.tfvars` file:

```hcl
# EC2 or EKS deployment

# Enable VPN
enable_vpn = true

# Certificate ARNs from step 1
vpn_server_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/xxxxx"
vpn_client_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/yyyyy"

# VPN Configuration
vpn_client_cidr_block     = "172.16.0.0/22"  # Must not overlap with VPC CIDR
vpn_split_tunnel          = true             # Recommended
vpn_transport_protocol    = "udp"            # udp (faster) or tcp
vpn_port                  = 443              # 443 or 1194
vpn_session_timeout_hours = 24               # 8-24 hours
vpn_client_login_banner   = "Welcome to Code-Server VPN. Authorized access only."

# Make ALB internal (required for VPN-only access)
internal_alb = true
```

### 3. Deploy VPN

Deploy the infrastructure with VPN enabled:

```bash
# EC2 Deployment
cd deployments/ec2
terraform apply

# EKS Deployment
cd deployments/eks
terraform apply
```

Terraform will create:
- Client VPN Endpoint
- VPN Network Associations (in private subnets)
- Authorization Rules (allow access to VPC CIDR)
- Security Group for VPN
- CloudWatch Log Group for VPN connections

**Deployment Time:** ~5-10 minutes for VPN endpoint to become available

### 4. Export Client Configuration

After deployment completes, export the VPN client configuration:

```bash
cd terraform/scripts

# Auto-detect VPN endpoint from Terraform state
./export-vpn-config.sh

# Or specify manually
./export-vpn-config.sh <vpn-endpoint-id> [region] [output-dir] [cert-dir]

# Example:
./export-vpn-config.sh cvpn-endpoint-0123456789abcdef0 us-east-1 ./vpn-config ./vpn-certs
```

This script:
1. Downloads VPN configuration from AWS
2. Embeds client certificate and key
3. Creates platform-ready `.ovpn` file

**Output:** `code-server-vpn.ovpn` - ready to distribute to users

### 5. Distribute to Users

**Securely** distribute these files to authorized users:
- `code-server-vpn.ovpn` - VPN configuration file

**Distribution Methods:**
- Encrypted email
- Secure file sharing (e.g., 1Password, encrypted USB)
- MDM system for corporate devices
- Secure internal portal

## Client Setup

### macOS

1. **Install Tunnelblick** (free, open-source)
   ```bash
   brew install --cask tunnelblick
   # Or download from https://tunnelblick.net/
   ```

2. **Import Configuration**
   - Double-click `code-server-vpn.ovpn`
   - Tunnelblick will import it automatically

3. **Connect**
   - Click Tunnelblick icon in menu bar
   - Select "Connect code-server-vpn"
   - VPN should connect within a few seconds

### Windows

1. **Install OpenVPN Connect**
   - Download from https://openvpn.net/client-connect-vpn-for-windows/
   - Install and launch

2. **Import Configuration**
   - File → Import Profile
   - Select `code-server-vpn.ovpn`

3. **Connect**
   - Click "Connect" on the profile
   - Wait for connection to establish

### Linux

1. **Install OpenVPN**
   ```bash
   # Debian/Ubuntu
   sudo apt-get update
   sudo apt-get install openvpn

   # RHEL/CentOS
   sudo yum install openvpn

   # Arch
   sudo pacman -S openvpn
   ```

2. **Connect**
   ```bash
   sudo openvpn --config code-server-vpn.ovpn
   ```

3. **Run as Service** (optional)
   ```bash
   sudo cp code-server-vpn.ovpn /etc/openvpn/client/code-server.conf
   sudo systemctl start openvpn-client@code-server
   sudo systemctl enable openvpn-client@code-server
   ```

### iOS

1. **Install OpenVPN Connect**
   - Download from App Store

2. **Transfer Configuration**
   - Email to yourself, or
   - Use AirDrop, or
   - Upload to iCloud/Dropbox

3. **Import and Connect**
   - Open `.ovpn` file
   - Import to OpenVPN Connect
   - Tap "Connect"

### Android

1. **Install OpenVPN for Android**
   - Download from Google Play Store

2. **Transfer Configuration**
   - Email to yourself, or
   - Upload to Google Drive/Dropbox

3. **Import and Connect**
   - Open `.ovpn` file
   - Import to OpenVPN
   - Tap "Connect"

## Testing VPN Connection

### 1. Connect to VPN

Connect using your platform's VPN client (see Client Setup above).

### 2. Verify VPN Connection

**macOS/Linux:**
```bash
# Check VPN interface
ifconfig | grep tun

# Check VPN IP assignment
ifconfig tun0  # or tun1, etc.

# Should show IP in 172.16.0.0/22 range
```

**Windows:**
```powershell
# Check VPN adapter
ipconfig | findstr "172.16"
```

### 3. Test Access to Code-Server

Get the internal ALB DNS name:
```bash
# From Terraform output
terraform output alb_dns_name  # EC2
# Or
kubectl get ingress -n code-server  # EKS
```

Access code-server:
```bash
# EC2
curl -I http://<alb-dns-name>

# EKS
curl -I http://<alb-dns-name>
```

**Expected Result:** You should get a redirect to OAuth2 login or code-server login page.

### 4. Check CloudWatch Logs

View VPN connection logs:
```bash
aws logs tail /aws/vpn/<prefix> --follow
```

You should see connection events with your IP address.

## Advanced Configuration

### Multiple Client Certificates

To create additional client certificates for different users:

```bash
# Generate new client cert
openssl genrsa -out client2.key 2048
openssl req -new -key client2.key -out client2.csr
openssl x509 -req -days 3650 -in client2.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client2.crt

# Create user-specific .ovpn file
./export-vpn-config.sh <vpn-endpoint-id> us-east-1 ./user2-config ./
# Manually replace client cert/key in the .ovpn file
```

### SAML/SSO Authentication

For enterprise deployments, use SAML-based authentication instead of certificates:

```hcl
# terraform.tfvars
vpn_authentication_type = "federated-authentication"
enable_saml_authentication = true
saml_provider_arn = "arn:aws:iam::123456789012:saml-provider/YourSAMLProvider"
```

This combines VPN (network access) with SAML (user authentication).

### Split Tunnel Configuration

**Enabled (default - recommended):**
```hcl
vpn_split_tunnel = true
```
- Only VPC traffic (10.0.0.0/16) routed through VPN
- Internet traffic goes directly
- Better performance for users

**Disabled (full tunnel):**
```hcl
vpn_split_tunnel = false
```
- All traffic routed through VPN
- More secure but slower
- Required for some compliance scenarios

### Custom DNS Servers

Route DNS queries through VPN:

```hcl
vpn_dns_servers = ["10.0.0.2"]  # VPC DNS resolver
```

### Session Timeout

Configure VPN session duration:

```hcl
vpn_session_timeout_hours = 12  # 8-24 hours
```

Users will be disconnected after this period and must reconnect.

## Troubleshooting

### Connection Fails

**Check Certificate Validity:**
```bash
openssl x509 -in client.crt -text -noout
# Verify "Not After" date
```

**Check VPN Endpoint Status:**
```bash
aws ec2 describe-client-vpn-endpoints \
  --client-vpn-endpoint-ids <endpoint-id>
```

**Check CloudWatch Logs:**
```bash
aws logs tail /aws/vpn/<prefix> --follow
```

### Cannot Access Code-Server After Connecting

**1. Verify VPN IP Assignment:**
```bash
ifconfig | grep 172.16  # macOS/Linux
ipconfig | findstr "172.16"  # Windows
```

**2. Check Authorization Rules:**
```bash
aws ec2 describe-client-vpn-authorization-rules \
  --client-vpn-endpoint-id <endpoint-id>
```

**3. Check Security Groups:**
```bash
# Verify VPN security group allows traffic to ALB
aws ec2 describe-security-groups --group-ids <sg-id>
```

**4. Test DNS Resolution:**
```bash
nslookup <alb-dns-name>
dig <alb-dns-name>
```

### Split Tunnel Not Working

Check routing table after VPN connection:

**macOS/Linux:**
```bash
netstat -rn | grep tun
# Should only see VPC CIDR (10.0.0.0/16) routes
```

**Windows:**
```powershell
route print | findstr "172.16"
```

### Certificate Expired

Certificates are valid for 10 years by default. To renew:

1. Generate new certificates (see Step 1)
2. Update certificate ARNs in Terraform
3. Run `terraform apply`
4. Export new client configuration
5. Distribute to users

## Cost Considerations

### AWS Client VPN Pricing (as of 2024)

**Endpoint Association:**
- $0.10 per hour per subnet association
- For 3 subnets (multi-AZ): ~$216/month

**Connection Time:**
- $0.05 per hour per connection
- For 10 active users (8 hrs/day): ~$88/month

**Total Estimated Cost:**
- Base: ~$216/month (always running)
- Variable: ~$0.40 per user per day

**Cost Optimization:**

1. **Single Subnet Association** (not recommended for production):
   ```hcl
   subnet_ids = [module.vpc.private_subnet_ids[0]]  # Only one AZ
   ```
   Saves: ~$140/month (but loses HA)

2. **Scheduled VPN** (for dev environments):
   - Use Lambda to disable VPN outside business hours
   - Potential savings: ~50-70%

3. **Alternative: Direct Connect or Site-to-Site VPN:**
   - For office connectivity: Site-to-Site VPN ($0.05/hr = ~$36/month)
   - For large teams: Direct Connect (higher setup, lower per-GB cost)

## Security Best Practices

1. **Certificate Management:**
   - Store CA private key in HSM or secure vault
   - Rotate certificates annually
   - Revoke certificates for departed users

2. **Monitoring:**
   - Set up CloudWatch Alarms for unusual connection patterns
   - Review VPN logs regularly
   - Alert on failed authentication attempts

3. **Network Segmentation:**
   - Use separate subnets for VPN clients if needed
   - Apply additional security groups for VPN traffic
   - Implement network ACLs for defense in depth

4. **Multi-Factor Authentication:**
   - Combine VPN (certificate) + OAuth2/SAML for true MFA
   - Optionally add SAML to VPN itself for triple-factor

5. **Access Control:**
   - Use separate client certificates per user for audit trail
   - Implement IP-based restrictions if needed
   - Regular access reviews

## Additional Resources

- [AWS Client VPN Documentation](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/what-is.html)
- [AWS Client VPN Pricing](https://aws.amazon.com/vpn/pricing/)
- [OpenVPN Documentation](https://openvpn.net/community-resources/)
- [Tunnelblick Documentation](https://tunnelblick.net/documents.html)

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review CloudWatch Logs
- Check AWS VPN endpoint status
- Consult main [README.md](README.md)
