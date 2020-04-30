FROM debian:10

RUN apt-get update \
 && apt-get install -y \
    curl \
    dumb-init \
    htop \
    locales \
    man \
    nano \
    git \
    procps \
    ssh \
    sudo \
    vim \
    lsb-release \
  && rm -rf /var/lib/apt/lists/*

# https://wiki.debian.org/Locale#Manually
RUN sed -i "s/# en_US.UTF-8/en_US.UTF-8/" /etc/locale.gen \
  && locale-gen
ENV LANG=en_US.UTF-8

RUN chsh -s /bin/bash
ENV SHELL=/bin/bash

RUN adduser --gecos '' --disabled-password coder && \
  echo "coder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd

SHELL ["/bin/bash", "-c"]

COPY ci/lib.sh /tmp/lib.sh
RUN source /tmp/lib.sh && rm /tmp/lib.sh && \
    curl -L "https://github.com/boxboat/fixuid/releases/download/v0.4.1/fixuid-0.4.1-linux-$(arch).tar.gz" | tar -C /usr/local/bin -xzf - && \
    chown root:root /usr/local/bin/fixuid && \
    chmod 4755 /usr/local/bin/fixuid && \
    mkdir -p /etc/fixuid && \
    printf "user: coder\ngroup: coder\n" > /etc/fixuid/config.yml

COPY release-github/code-server*.deb /tmp/
RUN dpkg -i /tmp/code-server*.deb && rm /tmp/code-server*.deb

EXPOSE 8080
USER coder
WORKDIR /home/coder
ENTRYPOINT ["dumb-init", "fixuid", "-q", "/usr/bin/code-server", "--bind-addr", "0.0.0.0:8080", "."]
