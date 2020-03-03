FROM centos:7

RUN yum update -y \
  && yum install -y epel-release centos-release-scl \
  && yum-config-manager --enable rhel-server-rhscl-7-rpms \
  && yum update -y \
  && yum install -y \
    devtoolset-6 \
    gcc-c++ \
    xz \
    ccache \
    git \
    wget \
    openssl \
    libxkbfile-devel \
    libsecret-devel \
    libx11-devel

RUN mkdir /usr/share/node && cd /usr/share/node \
  && curl https://nodejs.org/dist/v12.14.0/node-v12.14.0-linux-x64.tar.xz | tar xJ --strip-components=1 --
ENV PATH "$PATH:/usr/share/node/bin"
RUN npm install -g yarn

RUN curl -L https://github.com/mvdan/sh/releases/download/v3.0.1/shfmt_v3.0.1_linux_amd64 > /usr/local/bin/shfmt \
  && chmod +x /usr/local/bin/shfmt

RUN echo 'source /opt/rh/devtoolset-6/enable' >> /root/.bashrc

ENTRYPOINT ["/bin/bash", "-c"]
