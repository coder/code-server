FROM node:12-buster

RUN apt-get update && apt-get install -y \
	libxkbfile-dev \
	libsecret-1-dev \
	dumb-init

RUN curl -L https://github.com/mvdan/sh/releases/download/v3.0.1/shfmt_v3.0.1_linux_amd64 > /usr/local/bin/shfmt && chmod +x /usr/local/bin/shfmt

COPY entrypoint.sh /bin/entrypoint.sh

ENTRYPOINT ["dumb-init", "/bin/entrypoint.sh"]
