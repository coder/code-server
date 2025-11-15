# SAML/OIDC Authentication Setup Guide

This guide provides step-by-step instructions for configuring various identity providers with code-server deployment.

## Table of Contents

- [Overview](#overview)
- [Okta Setup](#okta-setup)
- [Azure Active Directory Setup](#azure-active-directory-setup)
- [Google Workspace Setup](#google-workspace-setup)
- [AWS IAM Identity Center (SSO) Setup](#aws-iam-identity-center-sso-setup)
- [Generic OIDC Provider](#generic-oidc-provider)
- [Testing Authentication](#testing-authentication)
- [Troubleshooting](#troubleshooting)

## Overview

The code-server deployment uses OAuth2 Proxy to provide authentication via SAML/OIDC. This acts as a reverse proxy that handles authentication before requests reach code-server.

### Key Concepts

- **OIDC Discovery URL**: Endpoint that provides IdP configuration
- **Client ID**: Unique identifier for your application
- **Client Secret**: Secret key for authentication
- **Redirect URI**: URL where users return after authentication
- **Cookie Secret**: Secret for encrypting session cookies

## Okta Setup

### 1. Create Application in Okta

1. Log in to your Okta admin console
2. Navigate to **Applications** → **Applications**
3. Click **Create App Integration**
4. Select:
   - **Sign-in method**: OIDC - OpenID Connect
   - **Application type**: Web Application
5. Click **Next**

### 2. Configure Application

**General Settings:**
- **App integration name**: Code-Server
- **Logo**: (optional) Upload code-server logo

**Sign-in redirect URIs:**
```
https://code-server.example.com/oauth2/callback
```

**Sign-out redirect URIs:**
```
https://code-server.example.com
```

**Assignments:**
- **Controlled access**: Choose who can access (Everyone, specific groups, etc.)

Click **Save**

### 3. Get Configuration Values

After creating the application:

1. Copy **Client ID**
2. Copy **Client Secret** (click "Show" if hidden)
3. Note your Okta domain (e.g., `dev-12345.okta.com`)

### 4. Configure Terraform Variables

```hcl
# terraform.tfvars

oauth2_issuer_url    = "https://dev-12345.okta.com/.well-known/openid-configuration"
oauth2_client_id     = "<YOUR_CLIENT_ID>"
oauth2_client_secret = "<YOUR_CLIENT_SECRET>"
oauth2_redirect_url  = "https://code-server.example.com/oauth2/callback"

# Generate cookie secret
# python -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())'
oauth2_cookie_secret = "<GENERATED_SECRET>"

# Optional: Restrict to specific users
oauth2_allowed_emails = [
  "user1@company.com",
  "user2@company.com"
]
```

### 5. Assign Users

In Okta admin console:
1. Go to **Applications** → **Code-Server**
2. Click **Assignments** tab
3. Click **Assign** → **Assign to People** or **Assign to Groups**
4. Add users/groups who should have access

## Azure Active Directory Setup

### 1. Register Application

1. Log in to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**

### 2. Configure Application

**Name:** Code-Server
**Supported account types:**
- Single tenant (most common)
- Or Multi-tenant if needed

**Redirect URI:**
- Platform: **Web**
- URL: `https://code-server.example.com/oauth2/callback`

Click **Register**

### 3. Configure Authentication

1. Go to **Authentication** in left menu
2. Under **Implicit grant and hybrid flows**, check:
   - ✅ ID tokens (used for implicit and hybrid flows)
3. Under **Advanced settings**:
   - Allow public client flows: **No**
4. Click **Save**

### 4. Create Client Secret

1. Go to **Certificates & secrets** in left menu
2. Click **New client secret**
3. Description: Code-Server
4. Expires: Choose duration (24 months recommended)
5. Click **Add**
6. **Copy the secret value immediately** (it won't be shown again)

### 5. API Permissions

1. Go to **API permissions** in left menu
2. Verify these permissions exist:
   - Microsoft Graph → `openid`
   - Microsoft Graph → `profile`
   - Microsoft Graph → `email`
3. Click **Grant admin consent** (if you have admin rights)

### 6. Get Configuration Values

From **Overview** page:
- **Application (client) ID**: Copy this
- **Directory (tenant) ID**: Copy this

### 7. Configure Terraform Variables

```hcl
# terraform.tfvars

oauth2_issuer_url    = "https://login.microsoftonline.com/<TENANT_ID>/v2.0/.well-known/openid-configuration"
oauth2_client_id     = "<APPLICATION_CLIENT_ID>"
oauth2_client_secret = "<CLIENT_SECRET>"
oauth2_redirect_url  = "https://code-server.example.com/oauth2/callback"
oauth2_cookie_secret = "<GENERATED_SECRET>"

# Optional: Restrict by email
oauth2_allowed_emails = [
  "user1@company.com",
  "user2@company.com"
]
```

### 8. Restrict Access (Optional)

To limit access to specific users/groups:

1. Go to **Enterprise applications**
2. Find your **Code-Server** application
3. Go to **Properties**
4. Set **User assignment required?** to **Yes**
5. Go to **Users and groups**
6. Click **Add user/group**
7. Select users or groups

## Google Workspace Setup

### 1. Create OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**

### 2. Configure OAuth Consent Screen

If prompted:
1. Click **Configure Consent Screen**
2. User Type: **Internal** (for Google Workspace) or **External**
3. Fill in application information:
   - App name: Code-Server
   - User support email: Your email
   - Developer contact: Your email
4. Scopes: Add `openid`, `email`, `profile`
5. Click **Save and Continue**

### 3. Create OAuth Client ID

**Application type:** Web application

**Name:** Code-Server

**Authorized redirect URIs:**
```
https://code-server.example.com/oauth2/callback
```

Click **Create**

### 4. Get Configuration Values

After creation:
- Copy **Client ID**
- Copy **Client Secret**

### 5. Configure Terraform Variables

```hcl
# terraform.tfvars

oauth2_issuer_url    = "https://accounts.google.com/.well-known/openid-configuration"
oauth2_client_id     = "<YOUR_CLIENT_ID>.apps.googleusercontent.com"
oauth2_client_secret = "<YOUR_CLIENT_SECRET>"
oauth2_redirect_url  = "https://code-server.example.com/oauth2/callback"
oauth2_cookie_secret = "<GENERATED_SECRET>"

# Restrict to your domain
oauth2_allowed_emails = [
  "user1@company.com",
  "user2@company.com"
]
```

### 6. Domain Restriction (Google Workspace)

To restrict to your entire domain:

```yaml
# For EKS: k8s/oauth2-proxy.yaml
# Add to ConfigMap:
email_domains = ["company.com"]
```

## AWS IAM Identity Center (SSO) Setup

### 1. Enable IAM Identity Center

1. Go to [IAM Identity Center](https://console.aws.amazon.com/singlesignon)
2. Enable IAM Identity Center if not already enabled
3. Note your **AWS access portal URL**

### 2. Register Application

1. In IAM Identity Center, go to **Applications**
2. Click **Add application**
3. Select **I have an application I want to set up**
4. Click **Next**

### 3. Configure Application

**Display name:** Code-Server

**Description:** Code-Server IDE

**Application start URL:** `https://code-server.example.com`

**Application metadata:**
- Choose **Manual entry**
- **Application ACS URL**: `https://code-server.example.com/oauth2/callback`
- **Application SAML audience**: `https://code-server.example.com`

Click **Submit**

### 4. Get Configuration Values

1. Download the **IAM Identity Center SAML metadata file**
2. Note the **Client ID** (from application details)
3. Create a **Client Secret** (in application settings)

### 5. Configure Terraform Variables

```hcl
# terraform.tfvars

# Use OIDC endpoint for your region
oauth2_issuer_url    = "https://portal.sso.<region>.amazonaws.com/.well-known/openid-configuration"
oauth2_client_id     = "<YOUR_CLIENT_ID>"
oauth2_client_secret = "<YOUR_CLIENT_SECRET>"
oauth2_redirect_url  = "https://code-server.example.com/oauth2/callback"
oauth2_cookie_secret = "<GENERATED_SECRET>"
```

### 6. Assign Users

1. Go to **Assigned users** tab
2. Click **Assign users**
3. Select users or groups
4. Click **Assign users**

## Generic OIDC Provider

For any OIDC-compliant provider:

### 1. Required Information

Obtain from your IdP:
- OIDC Discovery URL (usually `https://idp.example.com/.well-known/openid-configuration`)
- Client ID
- Client Secret
- Supported scopes (typically `openid`, `profile`, `email`)

### 2. Register Redirect URI

In your IdP, register:
```
https://code-server.example.com/oauth2/callback
```

### 3. Configure Terraform Variables

```hcl
# terraform.tfvars

oauth2_issuer_url    = "<OIDC_DISCOVERY_URL>"
oauth2_client_id     = "<CLIENT_ID>"
oauth2_client_secret = "<CLIENT_SECRET>"
oauth2_redirect_url  = "https://code-server.example.com/oauth2/callback"
oauth2_cookie_secret = "<GENERATED_SECRET>"
```

## Testing Authentication

### 1. Deploy Application

```bash
# EC2
cd deployments/ec2
terraform apply

# EKS
cd deployments/eks
terraform apply
kubectl apply -f k8s/oauth2-proxy.yaml
```

### 2. Access Application

Navigate to your code-server URL (e.g., `https://code-server.example.com`)

### 3. Expected Flow

1. Browser redirects to IdP login page
2. Enter credentials and authenticate
3. IdP redirects back to code-server with authorization code
4. OAuth2 Proxy exchanges code for tokens
5. Session cookie is set
6. Request is proxied to code-server
7. Code-server interface loads

### 4. Verify Session

After successful login:
- Check browser cookies for `_oauth2_proxy` cookie
- Cookie should be HttpOnly, Secure, and SameSite

### 5. Test Logout

Navigate to: `https://code-server.example.com/oauth2/sign_out`

You should be logged out and redirected to IdP

## Troubleshooting

### Common Issues

#### Redirect URI Mismatch

**Error:** `redirect_uri_mismatch` or similar

**Solution:**
1. Verify redirect URI in IdP exactly matches Terraform configuration
2. Check for trailing slashes (should not have them)
3. Ensure HTTPS (not HTTP)

#### Invalid Client

**Error:** `invalid_client`

**Solution:**
1. Verify Client ID is correct
2. Verify Client Secret is correct and not expired
3. Check that client is enabled in IdP

#### Cookie Errors

**Error:** Authentication succeeds but session is not maintained

**Solution:**
1. Ensure `oauth2_cookie_secret` is set and is 32 bytes (base64 encoded)
2. Verify domain in cookie matches your URL
3. Check browser is accepting cookies
4. Ensure HTTPS is configured (cookies may not work over HTTP)

#### Access Denied

**Error:** User authenticates but gets "Access Denied"

**Solution:**
1. Check `oauth2_allowed_emails` list
2. Verify user is assigned to application in IdP
3. Check OAuth2 Proxy logs:
   ```bash
   # EC2
   aws logs tail /aws/ec2/<prefix>-code-server --filter-pattern oauth2-proxy

   # EKS
   kubectl logs -n code-server -l app=oauth2-proxy
   ```

#### Issuer URL Not Accessible

**Error:** `error fetching OIDC discovery`

**Solution:**
1. Verify issuer URL is accessible from your network
2. Check security groups allow outbound HTTPS
3. Verify URL is correct (test in browser)
4. Check for typos in URL

### Debug Mode

Enable debug logging:

**EC2:**

Edit `modules/ec2/user-data.sh` and add to oauth2-proxy args:
```yaml
- --log-level=debug
```

**EKS:**

Edit `deployments/eks/k8s/oauth2-proxy.yaml`:
```yaml
args:
  - --log-level=debug
```

### Testing Connectivity

**Test OIDC Discovery:**
```bash
curl -s https://your-idp.com/.well-known/openid-configuration | jq .
```

**Test Redirect:**
```bash
# Should show OAuth2 login page
curl -I https://code-server.example.com
```

**Check OAuth2 Proxy Health:**
```bash
# EC2
curl http://<instance-ip>:4180/ping

# EKS
kubectl port-forward -n code-server svc/oauth2-proxy 4180:4180
curl http://localhost:4180/ping
```

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS for production
2. **Rotate Secrets**: Regularly rotate client secrets and cookie secrets
3. **Limit Scope**: Request only necessary OIDC scopes
4. **Session Timeout**: Configure appropriate session expiry
5. **Restrict Emails**: Use `oauth2_allowed_emails` to limit access
6. **Monitor Logs**: Regularly review authentication logs
7. **Use Groups**: Manage access via IdP groups rather than individual users

## Additional Resources

- [OAuth2 Proxy Documentation](https://oauth2-proxy.github.io/oauth2-proxy/)
- [OIDC Specification](https://openid.net/connect/)
- [Okta OIDC Guide](https://developer.okta.com/docs/concepts/oauth-openid/)
- [Azure AD OIDC Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc)
- [Google OIDC Guide](https://developers.google.com/identity/protocols/oauth2/openid-connect)
