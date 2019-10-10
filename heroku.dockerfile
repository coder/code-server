FROM node:10.16.0
ARG codeServerVersion=docker
ARG vscodeVersion=1.38.1
ARG githubToken

# Install VS Code's deps. These are the only two it seems we need.
RUN apt-get update && apt-get install -y \
	libxkbfile-dev \
	libsecret-1-dev

# Ensure latest yarn.
RUN npm install -g yarn@1.13

WORKDIR /src
COPY . .

RUN yarn \
	&& MINIFY=true GITHUB_TOKEN="${githubToken}" yarn build "${vscodeVersion}" "${codeServerVersion}" \
	&& yarn binary "${vscodeVersion}" "${codeServerVersion}" \
	&& mv "/src/build/code-server${codeServerVersion}-vsc${vscodeVersion}-linux-x86_64-built/code-server${codeServerVersion}-vsc${vscodeVersion}-linux-x86_64" /src/build/code-server \
	&& rm -r /src/build/vscode-* \
	&& rm -r /src/build/code-server*-linux-*

# We deploy with ubuntu so that devs have a familiar environment.
FROM ubuntu:18.04

RUN apt-get update && apt-get install -y \
	openssl \
	net-tools \
	git \
	locales \
	sudo \
	dumb-init \
	vim \
	curl \
	wget

RUN locale-gen en_US.UTF-8
# We cannot use update-locale because docker will not use the env variables
# configured in /etc/default/locale so we need to set it manually.
ENV LC_ALL=en_US.UTF-8

RUN adduser --gecos '' --disabled-password coder && \
	echo "coder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd

USER coder
# We create first instead of just using WORKDIR as when WORKDIR creates, the
# user is root.
RUN mkdir -p /home/coder/project

WORKDIR /home/coder/project

COPY --from=0 /src/build/code-server /usr/local/bin/code-server
EXPOSE 8080

ENTRYPOINT ["dumb-init", "code-server", "--host", "0.0.0.0"]
