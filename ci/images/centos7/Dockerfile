FROM centos:7

ARG NODE_VERSION=v12.18.4
RUN ARCH="$(uname -m | sed 's/86_64/64/; s/aarch64/arm64/')" && \
    curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-$ARCH.tar.xz" | tar -C /usr/local -xJ && \
    mv "/usr/local/node-$NODE_VERSION-linux-$ARCH" "/usr/local/node-$NODE_VERSION"
ENV PATH=/usr/local/node-$NODE_VERSION/bin:$PATH
RUN npm install -g yarn

RUN yum groupinstall -y 'Development Tools'
RUN yum install -y python2

RUN npm config set python python2

RUN yum install -y epel-release && yum install -y jq
RUN yum install -y rsync

# Copied from ../debian10/Dockerfile
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

RUN curl -fsSL https://get.docker.com | sh
