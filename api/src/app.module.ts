import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import {
  addReflectionToGrpcConfig,
  GrpcReflectionModule
} from 'nestjs-grpc-reflection';
import { join } from 'path';
import { AppController } from './app.controller';
import { AuthSessionModule } from './auth-session/auth-session.module';

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
  imports: [GrpcReflectionModule.register(grpcClientOptions), AuthSessionModule, ConfigModule.forRoot()],
})
export class AppModule {}

