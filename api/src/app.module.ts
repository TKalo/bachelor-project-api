import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import {
  addReflectionToGrpcConfig,
  GrpcReflectionModule,
} from 'nestjs-grpc-reflection';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const grpcClientOptions: GrpcOptions = addReflectionToGrpcConfig({
  transport: Transport.GRPC,
  options: {
    url: '0.0.0.0:50051',
    package: 'hero',
    protoPath: join(__dirname, '../../hero.proto'),
  },
});

@Module({
  controllers: [AppController],
  imports: [GrpcReflectionModule.register(grpcClientOptions)],
})
export class AppModule {}

