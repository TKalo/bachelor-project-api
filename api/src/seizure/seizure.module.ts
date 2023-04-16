import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtHandlerService } from 'src/common/services/jwt.service';
import { GrpcService } from '../common/services/grpc.service';
import { MongoModule } from '../common/services/mongo.service';
import { SeizurePersistenceService } from './seizure.persistence';
import { SeizureService } from './seizure.service';
import { SeizureController } from './seizure.controller';

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
    SeizureService,
    SeizurePersistenceService,
    JwtHandlerService,
  ],
  controllers: [SeizureController],
})
export class SeizureModule {}
