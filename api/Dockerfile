# First stage: build the application
FROM node:14-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
EXPOSE 50051
COPY . .
CMD [ "npm", "run", "start" ]