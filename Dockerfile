FROM node:9-alpine

ENV NODE_ENV production

RUN mkdir /app
WORKDIR /app

COPY yarn.lock /app
COPY package.json /app

RUN yarn

COPY . /app
RUN yarn build

EXPOSE 8080

CMD ["node", "server/index.js"] 
