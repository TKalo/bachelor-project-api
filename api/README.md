

### Generate grpc:    
- **Linux:**    protoc --plugin=node_modules/ts-proto/protoc-gen-ts_proto --ts_proto_out=./generated_proto hero.proto -I. --ts_proto_opt=nestJs=true --ts_proto_opt=addGrpcMetadata=true
 - **Windows:** protoc --plugin=protoc-gen-ts_proto=.\node_modules\.bin\protoc-gen-ts_proto.cmd --ts_proto_out=.\generated_proto hero.proto -I../ --ts_proto_opt=nestJs=true --ts_proto_opt=addGrpcMetadata=true

### db connection

**localhost:**        only use 0.0.0.0 NOT localhost
list services:    host:50051 list
list functions:   host:50051 list <service_name>

**generate interfaces:** tsproto --path ./hero.proto