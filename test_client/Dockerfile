
FROM google/dart-runtime AS build

WORKDIR /app

RUN apt-get update

RUN apt-get install -y protobuf-compiler

RUN pub global activate protoc_plugin

COPY hero.proto /app/

COPY pubspec.* /app/

COPY lib/ /app/bin/

RUN protoc --dart_out=grpc:lib/generated_proto -I/app/ /app/hero.proto

RUN dart pub get

CMD ["dart", "test"]