FROM reg.tria.dev/debian-code-server

RUN export PKG_CONFIG_PATH=/usr/lib/pkgconfig
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install nodejs -y
RUN npm install --global yarn 
RUN npm install argon2 esbuild jsonc-parser parse-semver katex markdown-it @iktakahiro/markdown-it-katex punycode dompurify
WORKDIR /home/node/app
COPY . .
RUN  yarn
COPY package.json .
EXPOSE 8080

CMD ["yarn", "run", "watch"]