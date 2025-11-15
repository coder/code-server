#!/bin/bash
# Destroy script for Code-Server EKS deployment

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

cleanup_k8s_resources() {
    echo_info "Cleaning up Kubernetes resources..."

    # Delete Code-Server Helm release
    helm uninstall code-server -n code-server 2>/dev/null || true

    # Delete OAuth2 Proxy
    kubectl delete -f "${DEPLOYMENT_DIR}/k8s/oauth2-proxy.yaml" 2>/dev/null || true

    # Delete namespace
    kubectl delete namespace code-server 2>/dev/null || true

    echo_info "Kubernetes resources cleaned up!"
}

main() {
    echo_warn "WARNING: This will destroy all Code-Server EKS infrastructure!"
    echo_warn "This action cannot be undone!"
    echo ""

    read -p "Are you sure you want to continue? (type 'yes' to confirm): " response
    if [ "$response" != "yes" ]; then
        echo_info "Destruction cancelled."
        exit 0
    fi

    cleanup_k8s_resources

    echo_info "Destroying Code-Server EKS infrastructure..."
    cd "${DEPLOYMENT_DIR}"
    terraform destroy

    echo_info "Destruction completed!"
}

main "$@"
