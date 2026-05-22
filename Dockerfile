FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN mkdir data

COPY . .

CMD ["node", "src/index.js"]
