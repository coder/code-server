#!/bin/bash
# Deployment script for Code-Server on EC2
# This script automates the deployment process

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="${SCRIPT_DIR}/../deployments/ec2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check prerequisites
check_prerequisites() {
    echo_info "Checking prerequisites..."

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        echo_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo_error "AWS credentials are not configured. Please configure AWS credentials first."
        exit 1
    fi

    echo_info "All prerequisites met!"
}

# Initialize Terraform
init_terraform() {
    echo_info "Initializing Terraform..."
    cd "${DEPLOYMENT_DIR}"
    terraform init
}

# Validate Terraform configuration
validate_terraform() {
    echo_info "Validating Terraform configuration..."
    cd "${DEPLOYMENT_DIR}"
    terraform validate
}

# Plan Terraform deployment
plan_terraform() {
    echo_info "Planning Terraform deployment..."
    cd "${DEPLOYMENT_DIR}"
    terraform plan -out=tfplan
}

# Apply Terraform deployment
apply_terraform() {
    echo_info "Applying Terraform deployment..."
    cd "${DEPLOYMENT_DIR}"

    read -p "Do you want to apply this plan? (yes/no): " response
    if [ "$response" != "yes" ]; then
        echo_warn "Deployment cancelled."
        exit 0
    fi

    terraform apply tfplan
    rm -f tfplan
}

# Get outputs
get_outputs() {
    echo_info "Getting deployment outputs..."
    cd "${DEPLOYMENT_DIR}"

    echo ""
    echo_info "=== Deployment Complete ==="
    echo ""

    ALB_URL=$(terraform output -raw alb_url 2>/dev/null || echo "N/A")
    SECRET_ARN=$(terraform output -raw code_server_password_secret_arn 2>/dev/null || echo "N/A")
    REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

    echo "Code-Server URL: $ALB_URL"
    echo ""
    echo "To get the code-server password, run:"
    echo "  aws secretsmanager get-secret-value \\"
    echo "    --secret-id $SECRET_ARN \\"
    echo "    --region $REGION \\"
    echo "    --query SecretString \\"
    echo "    --output text"
    echo ""
}

# Main deployment flow
main() {
    echo_info "Starting Code-Server EC2 deployment..."
    echo ""

    check_prerequisites
    init_terraform
    validate_terraform
    plan_terraform
    apply_terraform
    get_outputs

    echo_info "Deployment completed successfully!"
}

# Run main function
main "$@"
