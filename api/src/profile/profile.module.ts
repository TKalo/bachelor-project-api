import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { JwtModule } from '@nestjs/jwt';
import { MongoModule } from '../common/services/mongo.service';
import { ProfileController } from './profile.controller';
import { GrpcService } from '../common/services/grpc.service';
import { ProfileService } from './profile.service';
import { ProfilePersistenceService } from './profile.persistence';
import { JwtHandlerService } from 'src/common/services/jwt.service';
import { ProfileValidationService } from './validators/profile.validation';

@Module({
  imports: [
    MongoModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.getOrThrow('DATABASE_NAME'),
          signOptions: {
            expiresIn: 300,
          },
        };
      },
    }),
  ],
  providers: [
    ConfigService,
    GrpcService,
    ProfileService,
    ProfilePersistenceService,
    ProfileValidationService,
    JwtHandlerService,
  ],
  controllers: [ProfileController],
})
export class ProfileModule {}
