import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthSessionModule } from 'src/auth-session/auth-session.module';
import { AuthSessionPersistenceService } from 'src/auth-session/auth-session.persistence';
import { AuthSessionService } from 'src/auth-session/auth-session.service';
import { MongoModule } from '../common/mongo.service';

import { AuthController } from './auth.controller';
import { AuthPersistenceService } from './auth.persistence';
import { AuthService } from './auth.service';

@Module({
  imports: [
    MongoModule,
    AuthSessionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.getOrThrow("DATABASE_NAME"),
          signOptions: {
            expiresIn: 300,
          },
        };
      },
      
    }),
  ],
  providers: [AuthService, AuthPersistenceService, AuthSessionService, AuthSessionPersistenceService, ConfigService],
  controllers: [AuthController],
})
export class AuthModule {}
