FROM debian:8

RUN apt-get update

# Needed for debian repositories added below.
RUN apt-get install -y curl gnupg

# Installs node.
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && \
    apt-get install -y nodejs

# Installs yarn.
RUN curl -fsSL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn

# Installs VS Code build deps.
RUN apt-get install -y build-essential \
                   libsecret-1-dev \
                   libx11-dev \
                   libxkbfile-dev

# Installs envsubst.
RUN apt-get install -y gettext-base

# Misc build dependencies.
RUN apt-get install -y git rsync unzip

# We need latest jq from debian buster for date support.
RUN ARCH="$(dpkg --print-architecture)" && \
    curl -fsSOL http://http.us.debian.org/debian/pool/main/libo/libonig/libonig5_6.9.1-1_$ARCH.deb && \
    dpkg -i libonig*.deb && \
    curl -fsSOL http://http.us.debian.org/debian/pool/main/j/jq/libjq1_1.5+dfsg-2+b1_$ARCH.deb && \
    dpkg -i libjq*.deb && \
    curl -fsSOL http://http.us.debian.org/debian/pool/main/j/jq/jq_1.5+dfsg-2+b1_$ARCH.deb && \
    dpkg -i jq*.deb && rm *.deb

# Installs shellcheck.
# Unfortunately coredumps on debian:8 so disabled for now.
#RUN curl -fsSL https://github.com/koalaman/shellcheck/releases/download/v0.7.1/shellcheck-v0.7.1.linux.$(uname -m).tar.xz | \
#    tar -xJ && \
#    mv shellcheck*/shellcheck /usr/local/bin && \
#    rm -R shellcheck*

# Install Go dependencies
RUN ARCH="$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')" && \
    curl -fsSL "https://dl.google.com/go/go1.14.3.linux-$ARCH.tar.gz" | tar -C /usr/local -xz
ENV PATH=/usr/local/go/bin:/root/go/bin:$PATH
ENV GO111MODULE=on
RUN go get mvdan.cc/sh/v3/cmd/shfmt
RUN go get github.com/goreleaser/nfpm/cmd/nfpm

RUN curl -fsSL https://get.docker.com | sh
