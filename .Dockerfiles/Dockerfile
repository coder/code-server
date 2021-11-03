FROM reg.tria.dev/debian-code-server

RUN export PKG_CONFIG_PATH=/usr/lib/pkgconfig

# nvm installation start

# replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# update the repository sources list
# and install dependencies
RUN apt-get update \
    && apt-get install -y curl \
    && apt-get -y autoclean

# nvm environment variables
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 14.17.3

# install nvm
# https://github.com/creationix/nvm#install-script
RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash

# install node and npm
RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# confirm installation
RUN node -v
RUN npm -v

# nvm installation end
# RUN apt-get update
RUN npm install -g yarn@1.22.15
RUN npm install argon2 esbuild jsonc-parser parse-semver katex markdown-it @iktakahiro/markdown-it-katex punycode dompurify
WORKDIR /home/node/app
COPY . .
COPY package.json .
RUN yarn install
# yarn installations
WORKDIR /home/node/app/vendor
# RUN rm -rf modules
RUN yarn install --modules-folder modules --ignore-scripts
WORKDIR /home/node/app/vendor/modules/code-oss-dev
RUN yarn install
WORKDIR /home/node/app/vendor/modules/code-oss-dev/node_modules
RUN rm -rf node-pty
WORKDIR /home/node/app/vendor/modules/code-oss-dev
RUN npm i


WORKDIR /home/node/app
EXPOSE 8080

CMD ["yarn", "run", "watch"]