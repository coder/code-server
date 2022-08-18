# Use this file from the top of the repo, with `-f ci/release-image/docker-bake.hcl`

# Uses env var VERSION if set;
# normally, this is set by ci/lib.sh
variable "VERSION" {
    default = "latest"
}

group "default" {
    targets = ["code-server"]
}

target "code-server" {
    dockerfile = "ci/release-image/Dockerfile"
    tags = [
        "ghcr.io/DeputyHess/code-server-php:latest",
        notequal("latest",VERSION) ? "ghcr.io/DeputyHess/code-server-php:${VERSION}" : "",
    ]
    platforms = ["linux/amd64", "linux/arm64"]
}
