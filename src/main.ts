import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule, grpcClientOptions } from './app.module';



async function bootstrap() {
  Logger.debug(__dirname)
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, grpcClientOptions);
  await app.listen();
}
bootstrap();
