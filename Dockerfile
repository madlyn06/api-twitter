FROM node:20-alpine:3.17

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY ecosystem.config.js .
COPY .env.production .
COPY ./src ./src

RUN apk add python3
RUN npm install pm2 -g
RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]