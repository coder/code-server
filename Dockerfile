FROM node:8.15.0

RUN apt-get update && apt-get install -y \
	libxkbfile-dev \
	libsecret-1-dev

WORKDIR /src
COPY . .

# This takes ages and always dies in the end. :(
# RUN yarn --frozen-lockfile && yarn task build:server:binary

# Make the debugging easier - and the rebuilds faster
# and our life happier lets break up the build to sequential parts
RUN yarn --frozen-lockfile 

RUN yarn task vscode:install
RUN yarn task build:copy-vscode
RUN yarn task build:web
RUN yarn task build:bootstrap-fork
RUN yarn task build:default-extensions
RUN yarn task build:server:bundle
RUN yarn task build:app:browser
RUN yarn task build:server:binary:package

# We deploy with ubuntu so that devs have a familiar environment.
FROM ubuntu:18.10
WORKDIR /root/project

COPY --from=0 /src/packages/server/cli-linux-x64 /usr/local/bin/code-server
EXPOSE 8443

RUN apt-get update && apt-get install -y \
	openssl \
	net-tools

RUN apt-get install -y locales && \
	locale-gen en_US.UTF-8

# We unfortunately cannot use update-locale because docker will not use the env variables
# configured in /etc/default/locale so we need to set it manually.
ENV LANG=en_US.UTF-8
ENTRYPOINT code-server
CMD ["."]
