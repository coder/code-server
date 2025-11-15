#!/bin/bash
# Export AWS Client VPN configuration
# This script downloads the VPN client configuration file

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
if ! command -v aws &> /dev/null; then
    echo_error "AWS CLI is not installed. Please install AWS CLI first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo_error "AWS credentials are not configured. Please configure AWS credentials first."
    exit 1
fi

# Get VPN endpoint ID from Terraform output or as parameter
if [ -z "$1" ]; then
    echo_info "No VPN endpoint ID provided, attempting to get from Terraform..."

    # Try to get from terraform output
    if [ -f "terraform.tfstate" ]; then
        VPN_ENDPOINT_ID=$(terraform output -raw vpn_endpoint_id 2>/dev/null || echo "")
    fi

    if [ -z "$VPN_ENDPOINT_ID" ]; then
        echo_error "Could not find VPN endpoint ID."
        echo_error "Usage: $0 <vpn-endpoint-id> [region] [output-dir]"
        echo_error "Or run this script from the terraform deployment directory"
        exit 1
    fi
else
    VPN_ENDPOINT_ID="$1"
fi

REGION="${2:-us-east-1}"
OUTPUT_DIR="${3:-./vpn-config}"
CERT_DIR="${4:-./vpn-certificates}"

echo_info "VPN Endpoint ID: ${VPN_ENDPOINT_ID}"
echo_info "AWS Region: ${REGION}"
echo_info "Output Directory: ${OUTPUT_DIR}"
echo ""

# Create output directory
mkdir -p "${OUTPUT_DIR}"

echo_step "Step 1: Export VPN client configuration"
echo_info "Downloading VPN configuration from AWS..."

# Export the configuration
aws ec2 export-client-vpn-client-configuration \
    --client-vpn-endpoint-id "${VPN_ENDPOINT_ID}" \
    --region "${REGION}" \
    --output text > "${OUTPUT_DIR}/client-config.ovpn"

echo_info "VPN configuration downloaded to: ${OUTPUT_DIR}/client-config.ovpn"
echo ""

echo_step "Step 2: Add client certificate and key to configuration"

# Check if certificate files exist
if [ ! -f "${CERT_DIR}/client.crt" ] || [ ! -f "${CERT_DIR}/client.key" ]; then
    echo_warn "Client certificates not found in ${CERT_DIR}"
    echo_warn "You'll need to manually add <cert> and <key> sections to the .ovpn file"
    echo_warn "Or specify the correct certificate directory as 4th parameter"
else
    echo_info "Adding client certificate and key to configuration..."

    # Append certificate and key to the configuration
    echo "" >> "${OUTPUT_DIR}/client-config.ovpn"
    echo "<cert>" >> "${OUTPUT_DIR}/client-config.ovpn"
    cat "${CERT_DIR}/client.crt" >> "${OUTPUT_DIR}/client-config.ovpn"
    echo "</cert>" >> "${OUTPUT_DIR}/client-config.ovpn"
    echo "" >> "${OUTPUT_DIR}/client-config.ovpn"
    echo "<key>" >> "${OUTPUT_DIR}/client-config.ovpn"
    cat "${CERT_DIR}/client.key" >> "${OUTPUT_DIR}/client-config.ovpn"
    echo "</key>" >> "${OUTPUT_DIR}/client-config.ovpn"

    echo_info "Client certificate and key added to configuration"
fi

echo ""

echo_step "Step 3: Create platform-specific configurations"

# Copy for different platforms
cp "${OUTPUT_DIR}/client-config.ovpn" "${OUTPUT_DIR}/code-server-vpn.ovpn"

echo_info "Configuration files created:"
echo "  ${OUTPUT_DIR}/client-config.ovpn      - Original configuration"
echo "  ${OUTPUT_DIR}/code-server-vpn.ovpn    - Ready to import"
echo ""

echo_step "Installation Instructions:"
echo ""
echo "📱 macOS:"
echo "  1. Install Tunnelblick: https://tunnelblick.net/downloads.html"
echo "  2. Double-click code-server-vpn.ovpn"
echo "  3. Click 'Connect'"
echo ""
echo "🪟 Windows:"
echo "  1. Install OpenVPN Connect: https://openvpn.net/client-connect-vpn-for-windows/"
echo "  2. Import code-server-vpn.ovpn"
echo "  3. Click 'Connect'"
echo ""
echo "🐧 Linux:"
echo "  1. Install OpenVPN:"
echo "     sudo apt-get install openvpn  # Debian/Ubuntu"
echo "     sudo yum install openvpn      # RHEL/CentOS"
echo "  2. Connect using:"
echo "     sudo openvpn --config ${OUTPUT_DIR}/code-server-vpn.ovpn"
echo ""
echo "📱 iOS:"
echo "  1. Install OpenVPN Connect from App Store"
echo "  2. Transfer code-server-vpn.ovpn to your device"
echo "  3. Import and connect"
echo ""
echo "🤖 Android:"
echo "  1. Install OpenVPN for Android from Play Store"
echo "  2. Transfer code-server-vpn.ovpn to your device"
echo "  3. Import and connect"
echo ""

echo_info "✅ VPN configuration export complete!"
echo_warn "🔒 Please distribute this configuration securely to authorized users only"
echo ""

echo_info "To test the VPN connection:"
echo "  1. Connect to VPN using the configuration file"
echo "  2. Access code-server at the private ALB address"
echo "  3. Check CloudWatch Logs for VPN connection logs:"
echo "     aws logs tail /aws/vpn/<prefix> --follow"
