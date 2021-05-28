# Use this file from the top of the repo, with `-f ci/release-image/docker-bake.hcl`

# Uses env var VERSION if set;
# normally, this is set by ci/lib.sh
variable "VERSION" {
    default = "latest"
}

group "default" {
    targets = ["code-server-amd64", "code-server-arm64"]
}

target "code-server-amd64" {
    dockerfile = "ci/release-image/Dockerfile"
    tags = ["docker.io/codercom/code-server-amd64:${VERSION}"]
    platforms = ["linux/amd64"]
    output = ["type=tar,dest=./release-images/code-server-amd64-${VERSION}.tar"]
}

target "code-server-arm64" {
    dockerfile = "ci/release-image/Dockerfile"
    tags = ["docker.io/codercom/code-server-arm64:${VERSION}"]
    platforms = ["linux/arm64"]
    output = ["type=tar,dest=./release-images/code-server-arm64-${VERSION}.tar"]
}
