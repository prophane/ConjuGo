FROM node:20-alpine

WORKDIR /app
COPY . /app

EXPOSE 3077

CMD ["node", "server.js"]
