FROM debian:10

RUN apt-get update

# Needed for debian repositories added below.
RUN apt-get install -y curl gnupg

# Installs node.
RUN curl -fsSL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs

# Installs yarn.
RUN curl -fsSL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn

# Installs VS Code build deps.
RUN apt-get install -y build-essential

# Installs envsubst.
RUN apt-get install -y gettext-base

# Misc build dependencies.
RUN apt-get install -y git rsync unzip jq

# Installs shellcheck.
RUN curl -fsSL https://github.com/koalaman/shellcheck/releases/download/v0.7.1/shellcheck-v0.7.1.linux.$(uname -m).tar.xz | \
    tar -xJ && \
    mv shellcheck*/shellcheck /usr/local/bin && \
    rm -R shellcheck*

# Install Go.
RUN ARCH="$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')" && \
    curl -fsSL "https://dl.google.com/go/go1.14.3.linux-$ARCH.tar.gz" | tar -C /usr/local -xz
ENV GOPATH=/gopath
# Ensures running this image as another user works.
RUN mkdir -p $GOPATH && chmod -R 777 $GOPATH
ENV PATH=/usr/local/go/bin:$GOPATH/bin:$PATH

# Install Go dependencies
ENV GO111MODULE=on
RUN go get github.com/goreleaser/nfpm/cmd/nfpm@v2.3.1

RUN VERSION="$(curl -fsSL https://storage.googleapis.com/kubernetes-release/release/stable.txt)" && \
    curl -fsSL "https://storage.googleapis.com/kubernetes-release/release/$VERSION/bin/linux/amd64/kubectl" > /usr/local/bin/kubectl \
    && chmod +x /usr/local/bin/kubectl
RUN curl -fsSL https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
RUN helm plugin install https://github.com/instrumenta/helm-kubeval

RUN curl -fsSL https://get.docker.com | sh
