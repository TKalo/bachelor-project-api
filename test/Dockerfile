FROM tkaldau/dart-protoc-client:latest

WORKDIR /app

COPY pubspec.* /app/

COPY hero.proto /app/

COPY lib/ /app/bin/

RUN dart pub get

RUN dart pub global activate protoc_plugin 20.0.1

RUN protoc -I=/app --plugin=protoc-gen-dart=$HOME/.pub-cache/bin/protoc-gen-dart --dart_out=grpc:bin/generated_proto hero.proto

CMD ["dart", "run"]