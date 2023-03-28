
FROM node:14-alpine AS build

WORKDIR /app

# install dependencies needed for building bcrypt
RUN apk add --no-cache make gcc g++ python3

# Install ts-proto code generation package
RUN npm install -g ts-proto

# install dependency from definition
RUN npm install

# Install protobuf
RUN apk update && apk add protobuf

# Copy the .proto file and generate TypeScript code
COPY ./hero.proto .

# Copy rest of application
COPY . .

# Build bcrypt from source
RUN npm install --unsafe-perm bcrypt

# run code generation
RUN protoc --plugin=node_modules/ts-proto/protoc-gen-ts_proto --ts_proto_out=./generated_proto hero.proto -I. --ts_proto_opt=nestJs=true --ts_proto_opt=addGrpcMetadata=true

EXPOSE 50051

# RUN npm run build
CMD [ "npm", "run", "start" ]