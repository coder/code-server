#!/bin/bash
# Deployment script for Code-Server on EKS
# This script automates the deployment process

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="${SCRIPT_DIR}/../deployments/eks"

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

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        echo_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi

    # Check Helm
    if ! command -v helm &> /dev/null; then
        echo_error "Helm is not installed. Please install Helm first."
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

# Configure kubectl
configure_kubectl() {
    echo_info "Configuring kubectl..."
    cd "${DEPLOYMENT_DIR}"

    CLUSTER_NAME=$(terraform output -raw eks_cluster_id)
    REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

    aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME"

    echo_info "Waiting for nodes to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=300s
}

# Deploy Code-Server
deploy_code_server() {
    echo_info "Deploying Code-Server..."

    read -p "Do you want to deploy Code-Server now? (yes/no): " response
    if [ "$response" != "yes" ]; then
        echo_warn "Code-Server deployment skipped. You can deploy it manually later."
        return
    fi

    cd "${SCRIPT_DIR}/../ci/helm-chart"

    helm upgrade --install code-server . \
        --namespace code-server \
        --create-namespace \
        --values "${DEPLOYMENT_DIR}/k8s/code-server-values.yaml" \
        --wait \
        --timeout 10m

    echo_info "Code-Server deployed successfully!"
}

# Deploy OAuth2 Proxy (optional)
deploy_oauth2_proxy() {
    echo_info "OAuth2 Proxy deployment..."

    read -p "Do you want to deploy OAuth2 Proxy for SAML authentication? (yes/no): " response
    if [ "$response" != "yes" ]; then
        echo_warn "OAuth2 Proxy deployment skipped."
        return
    fi

    cd "${DEPLOYMENT_DIR}"
    kubectl apply -f k8s/oauth2-proxy.yaml

    echo_info "OAuth2 Proxy deployed successfully!"
}

# Get outputs
get_outputs() {
    echo_info "Getting deployment information..."
    cd "${DEPLOYMENT_DIR}"

    echo ""
    echo_info "=== Deployment Complete ==="
    echo ""

    CLUSTER_NAME=$(terraform output -raw eks_cluster_id)
    REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

    echo "EKS Cluster: $CLUSTER_NAME"
    echo "Region: $REGION"
    echo ""

    echo "To get the Load Balancer URL, run:"
    echo "  kubectl get ingress -n code-server"
    echo ""

    echo "To access Code-Server:"
    echo "  1. Wait for the ingress to get an ADDRESS (ALB DNS name)"
    echo "  2. Access the URL shown in the ADDRESS field"
    echo ""

    echo "Useful commands:"
    echo "  kubectl get pods -n code-server"
    echo "  kubectl logs -n code-server -l app.kubernetes.io/name=code-server"
    echo "  kubectl port-forward -n code-server svc/code-server 8080:8080"
    echo ""
}

# Main deployment flow
main() {
    echo_info "Starting Code-Server EKS deployment..."
    echo ""

    check_prerequisites
    init_terraform
    validate_terraform
    plan_terraform
    apply_terraform
    configure_kubectl
    deploy_code_server
    deploy_oauth2_proxy
    get_outputs

    echo_info "Deployment completed successfully!"
}

# Run main function
main "$@"
