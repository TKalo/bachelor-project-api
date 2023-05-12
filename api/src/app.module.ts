import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import {
  GrpcReflectionModule,
  addReflectionToGrpcConfig,
} from 'nestjs-grpc-reflection';
import { join } from 'path';

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
    keepalive: {
      http2MaxPingStrikes: 1,
      http2MaxPingsWithoutData: 0,
      http2MinPingIntervalWithoutDataMs: 1000,
      http2MinTimeBetweenPingsMs: 100,
      keepalivePermitWithoutCalls: 1,
      keepaliveTimeMs: 10000,
      keepaliveTimeoutMs: 1000
    }
  },
});

@Module({
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

