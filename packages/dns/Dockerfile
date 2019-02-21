FROM node

COPY out/main.js /main.js
COPY package.json /package.json
RUN yarn
ENV NODE_ENV production

CMD ["node", "/main.js"]