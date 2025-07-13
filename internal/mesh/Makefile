# Headscale Makefile
# Modern Makefile following best practices

# Version calculation
VERSION ?= $(shell git describe --always --tags --dirty)

# Build configuration
GOOS ?= $(shell uname | tr '[:upper:]' '[:lower:]')
ifeq ($(filter $(GOOS), openbsd netbsd solaris plan9), )
	PIE_FLAGS = -buildmode=pie
endif

# Tool availability check with nix warning
define check_tool
	@command -v $(1) >/dev/null 2>&1 || { \
		echo "Warning: $(1) not found. Run 'nix develop' to ensure all dependencies are available."; \
		exit 1; \
	}
endef

# Source file collections using shell find for better performance
GO_SOURCES := $(shell find . -name '*.go' -not -path './gen/*' -not -path './vendor/*')
PROTO_SOURCES := $(shell find . -name '*.proto' -not -path './gen/*' -not -path './vendor/*')
DOC_SOURCES := $(shell find . \( -name '*.md' -o -name '*.yaml' -o -name '*.yml' -o -name '*.ts' -o -name '*.js' -o -name '*.html' -o -name '*.css' -o -name '*.scss' -o -name '*.sass' \) -not -path './gen/*' -not -path './vendor/*' -not -path './node_modules/*')

# Default target
.PHONY: all
all: lint test build

# Dependency checking
.PHONY: check-deps
check-deps:
	$(call check_tool,go)
	$(call check_tool,golangci-lint)
	$(call check_tool,gofumpt)
	$(call check_tool,prettier)
	$(call check_tool,clang-format)
	$(call check_tool,buf)

# Build targets
.PHONY: build
build: check-deps $(GO_SOURCES) go.mod go.sum
	@echo "Building headscale..."
	go build $(PIE_FLAGS) -ldflags "-X main.version=$(VERSION)" -o headscale ./cmd/headscale

# Test targets
.PHONY: test
test: check-deps $(GO_SOURCES) go.mod go.sum
	@echo "Running Go tests..."
	go test -race ./...


# Formatting targets
.PHONY: fmt
fmt: fmt-go fmt-prettier fmt-proto

.PHONY: fmt-go
fmt-go: check-deps $(GO_SOURCES)
	@echo "Formatting Go code..."
	gofumpt -l -w .
	golangci-lint run --fix

.PHONY: fmt-prettier
fmt-prettier: check-deps $(DOC_SOURCES)
	@echo "Formatting documentation and config files..."
	prettier --write '**/*.{ts,js,md,yaml,yml,sass,css,scss,html}'
	prettier --write --print-width 80 --prose-wrap always CHANGELOG.md

.PHONY: fmt-proto
fmt-proto: check-deps $(PROTO_SOURCES)
	@echo "Formatting Protocol Buffer files..."
	clang-format -i $(PROTO_SOURCES)

# Linting targets
.PHONY: lint
lint: lint-go lint-proto

.PHONY: lint-go
lint-go: check-deps $(GO_SOURCES) go.mod go.sum
	@echo "Linting Go code..."
	golangci-lint run --timeout 10m

.PHONY: lint-proto
lint-proto: check-deps $(PROTO_SOURCES)
	@echo "Linting Protocol Buffer files..."
	cd proto/ && buf lint

# Code generation
.PHONY: generate
generate: check-deps $(PROTO_SOURCES)
	@echo "Generating code from Protocol Buffers..."
	rm -rf gen
	buf generate proto

# Clean targets
.PHONY: clean
clean:
	rm -rf headscale gen

# Development workflow
.PHONY: dev
dev: fmt lint test build

# Help target
.PHONY: help
help:
	@echo "Headscale Development Makefile"
	@echo ""
	@echo "Main targets:"
	@echo "  all          - Run lint, test, and build (default)"
	@echo "  build        - Build headscale binary"
	@echo "  test         - Run Go tests"
	@echo "  fmt          - Format all code (Go, docs, proto)"
	@echo "  lint         - Lint all code (Go, proto)"
	@echo "  generate     - Generate code from Protocol Buffers"
	@echo "  dev          - Full development workflow (fmt + lint + test + build)"
	@echo "  clean        - Clean build artifacts"
	@echo ""
	@echo "Specific targets:"
	@echo "  fmt-go       - Format Go code only"
	@echo "  fmt-prettier - Format documentation only" 
	@echo "  fmt-proto    - Format Protocol Buffer files only"
	@echo "  lint-go      - Lint Go code only"
	@echo "  lint-proto   - Lint Protocol Buffer files only"
	@echo ""
	@echo "Dependencies:"
	@echo "  check-deps   - Verify required tools are available"
	@echo ""
	@echo "Note: If not running in a nix shell, ensure dependencies are available:"
	@echo "  nix develop"