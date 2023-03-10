

Generate grpc:    grpc_tools_node_protoc --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts --grpc_out=./generated_proto --js_out=import_style=commonjs,binary:./generated_proto --ts_out=./generated_proto ./hero.proto

list services:    0.0.0.0:50051 list
list functions:   0.0.0.0:50051 list <service_name>

generate interfaces: tsproto --path ./hero.proto