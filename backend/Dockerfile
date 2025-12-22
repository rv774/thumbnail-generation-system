FROM node:18-alpine

# Install ffmpeg for video processing
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# We will override the command in docker-compose to run either server or worker
CMD ["node", "dist/server.js"]
