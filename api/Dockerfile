# First stage: install dependencies
FROM node:14-alpine AS build

WORKDIR /app

#Copy dependency definition
COPY package*.json ./

#Install ts-proto code generation package
RUN npm install -g ts-proto

#install dependency from definition
RUN npm install

# Install protobuf
RUN apk update && apk add protobuf

# Copy the .proto file and generate TypeScript code
COPY ./hero.proto .

#Create folder for generated code
RUN mkdir /app/generated_proto

#run code generation
RUN protoc --plugin=node_modules/ts-proto/protoc-gen-ts_proto --ts_proto_out=./generated_proto hero.proto -I. --ts_proto_opt=nestJs=true --ts_proto_opt=addGrpcMetadata=true



# Second stage: build the application
FROM node:14-alpine AS compose
WORKDIR /app

# Copy the installed dependencies from the "deps" stage
COPY --from=build /app/node_modules /app/node_modules

# Copy the generated TypeScript code
COPY --from=build /app/generated_proto /app/generated_proto


# Copy the rest of the application code
COPY . .

EXPOSE 50051

CMD [ "npm", "run", "start" ]