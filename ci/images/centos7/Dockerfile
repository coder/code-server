FROM centos:7

RUN curl -sL https://rpm.nodesource.com/setup_14.x | bash - && \
      yum install -y nodejs && \
      npm install -g yarn

RUN yum groupinstall -y 'Development Tools'
RUN yum install -y python2 libsecret-devel libX11-devel libxkbfile-devel

RUN npm config set python python2

RUN yum install -y epel-release && yum install -y jq
RUN yum install -y rsync

# Copied from ../debian8/Dockerfile
# Install Go dependencies
RUN ARCH="$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')" && \
    curl -fsSL "https://dl.google.com/go/go1.14.3.linux-$ARCH.tar.gz" | tar -C /usr/local -xz
ENV PATH=/usr/local/go/bin:/root/go/bin:$PATH
ENV GO111MODULE=on
RUN go get mvdan.cc/sh/v3/cmd/shfmt
RUN go get github.com/goreleaser/nfpm/cmd/nfpm
