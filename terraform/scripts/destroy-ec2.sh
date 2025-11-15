#!/bin/bash
# Destroy script for Code-Server EC2 deployment

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

main() {
    echo_warn "WARNING: This will destroy all Code-Server EC2 infrastructure!"
    echo_warn "This action cannot be undone!"
    echo ""

    read -p "Are you sure you want to continue? (type 'yes' to confirm): " response
    if [ "$response" != "yes" ]; then
        echo_info "Destruction cancelled."
        exit 0
    fi

    echo_info "Destroying Code-Server EC2 infrastructure..."
    cd "${DEPLOYMENT_DIR}"
    terraform destroy

    echo_info "Destruction completed!"
}

main "$@"
