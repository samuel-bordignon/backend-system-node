FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY setup.sh ./
COPY . .

RUN chmod +x setup.sh

ENTRYPOINT ["./setup.sh"]