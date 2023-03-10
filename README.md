

Generate grpc:    protoc --plugin=node_modules/ts-proto/protoc-gen-ts_proto --ts_proto_out=./generated_proto hero.proto -I. --ts_proto_opt=nestJs=true

list services:    0.0.0.0:50051 list
list functions:   0.0.0.0:50051 list <service_name>

generate interfaces: tsproto --path ./hero.proto