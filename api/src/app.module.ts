import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import {
  GrpcReflectionModule,
  addReflectionToGrpcConfig,
} from 'nestjs-grpc-reflection';
import { join } from 'path';
import { AppController } from './app.controller';
import { AuthSessionModule } from './auth-session/auth-session.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { SeizureModule } from './seizure/seizure.module';

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
  imports: [
    GrpcReflectionModule.register(grpcClientOptions),
    AuthSessionModule,
    AuthModule,
    ProfileModule,
    SeizureModule,
    ConfigModule.forRoot(),
  ],
})
export class AppModule {}

