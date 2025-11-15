#!/bin/bash
# Generate certificates for AWS Client VPN
# This script creates server and client certificates required for VPN authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo_info "Checking prerequisites..."

    if ! command -v openssl &> /dev/null; then
        echo_error "OpenSSL is not installed. Please install OpenSSL first."
        exit 1
    fi

    if ! command -v aws &> /dev/null; then
        echo_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        echo_error "AWS credentials are not configured. Please configure AWS credentials first."
        exit 1
    fi

    echo_info "All prerequisites met!"
}

# Configuration
CERT_DIR="${1:-./vpn-certificates}"
REGION="${2:-us-east-1}"
COMMON_NAME="${3:-code-server-vpn}"

echo_info "Certificate Directory: ${CERT_DIR}"
echo_info "AWS Region: ${REGION}"
echo_info "Common Name: ${COMMON_NAME}"
echo ""

# Create certificate directory
mkdir -p "${CERT_DIR}"
cd "${CERT_DIR}"

echo_step "Step 1: Generate CA private key and certificate"
echo_info "Creating Certificate Authority (CA)..."

# Generate CA private key
openssl genrsa -out ca.key 2048

# Generate CA certificate
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=${COMMON_NAME}-ca"

echo_info "CA certificate created: ca.crt"
echo ""

echo_step "Step 2: Generate server private key and certificate"
echo_info "Creating server certificate..."

# Generate server private key
openssl genrsa -out server.key 2048

# Generate server certificate signing request (CSR)
openssl req -new -key server.key -out server.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=${COMMON_NAME}-server"

# Sign server certificate with CA
openssl x509 -req -days 3650 -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt

echo_info "Server certificate created: server.crt"
echo ""

echo_step "Step 3: Generate client private key and certificate"
echo_info "Creating client certificate..."

# Generate client private key
openssl genrsa -out client.key 2048

# Generate client certificate signing request (CSR)
openssl req -new -key client.key -out client.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=${COMMON_NAME}-client"

# Sign client certificate with CA
openssl x509 -req -days 3650 -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt

echo_info "Client certificate created: client.crt"
echo ""

echo_step "Step 4: Upload certificates to AWS Certificate Manager"
echo_info "Uploading server certificate to ACM..."

# Upload server certificate
SERVER_CERT_ARN=$(aws acm import-certificate \
    --certificate fileb://server.crt \
    --private-key fileb://server.key \
    --certificate-chain fileb://ca.crt \
    --region ${REGION} \
    --tags Key=Name,Value=${COMMON_NAME}-server Key=Purpose,Value=VPN-Server \
    --query CertificateArn \
    --output text)

echo_info "Server certificate uploaded: ${SERVER_CERT_ARN}"

# Upload client certificate (root CA)
echo_info "Uploading client root certificate to ACM..."
CLIENT_CERT_ARN=$(aws acm import-certificate \
    --certificate fileb://ca.crt \
    --private-key fileb://ca.key \
    --region ${REGION} \
    --tags Key=Name,Value=${COMMON_NAME}-client-root Key=Purpose,Value=VPN-Client-Root \
    --query CertificateArn \
    --output text)

echo_info "Client root certificate uploaded: ${CLIENT_CERT_ARN}"
echo ""

echo_step "Step 5: Save certificate ARNs to file"

cat > certificate-arns.txt <<EOF
Server Certificate ARN: ${SERVER_CERT_ARN}
Client Root Certificate ARN: ${CLIENT_CERT_ARN}
EOF

cat > terraform-vars.txt <<EOF
# Add these to your terraform.tfvars file:
enable_vpn                = true
vpn_server_certificate_arn = "${SERVER_CERT_ARN}"
vpn_client_certificate_arn = "${CLIENT_CERT_ARN}"
EOF

echo_info "Certificate ARNs saved to certificate-arns.txt"
echo ""

echo_step "Summary of Generated Files:"
echo "  ca.key         - CA private key (keep secure!)"
echo "  ca.crt         - CA certificate"
echo "  server.key     - Server private key (keep secure!)"
echo "  server.crt     - Server certificate"
echo "  client.key     - Client private key (distribute to VPN users)"
echo "  client.crt     - Client certificate (distribute to VPN users)"
echo ""

echo_step "Important Notes:"
echo "  1. Store ca.key and server.key securely (never share these!)"
echo "  2. Distribute client.key and client.crt to VPN users"
echo "  3. Add the certificate ARNs to your terraform.tfvars:"
cat terraform-vars.txt
echo ""

echo_info "✅ Certificate generation complete!"
echo_warn "🔒 Please backup the ${CERT_DIR} directory securely"
echo ""

echo_info "Next steps:"
echo "  1. Add the certificate ARNs to terraform.tfvars"
echo "  2. Set enable_vpn = true in terraform.tfvars"
echo "  3. Run terraform apply"
echo "  4. Export VPN client configuration using export-vpn-config.sh"
