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
        "docker.io/codercom/code-server:latest",
        notequal("latest",VERSION) ? "docker.io/codercom/code-server:${VERSION}" : "",
        "ghcr.io/coder/code-server:latest",
        notequal("latest",VERSION) ? "ghcr.io/coder/code-server:${VERSION}" : "",
    ]
    platforms = ["linux/amd64", "linux/arm64"]
}
