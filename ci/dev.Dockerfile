FROM node:12

RUN apt-get update && \
    apt-get install -y curl iproute2 vim libgpgme-dev libdevmapper-dev iptables net-tools libsecret-1-dev libx11-dev libxkbfile-dev libxkbfile-dev

CMD ["/bin/bash"]
