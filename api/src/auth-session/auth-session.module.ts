import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongoModule } from 'src/common/mongo.service';

import { AuthSessionController } from './auth-session.controller';
import { AuthSessionPersistenceService } from './auth-session.persistence';
import { AuthSessionService } from './auth-session.service';

@Module({
  imports: [
    MongoModule,
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
  providers: [AuthSessionService, AuthSessionPersistenceService, ConfigService],
  controllers: [AuthSessionController],
})
export class AuthSessionModule {}
