import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';

@Injectable()
export class GrpcService {
  constructor() {}

  extractToken(metadata: any): string {
    const token = metadata
      .get('authentication')
      ?.toString()
      ?.replace(/^Bearer\s/, '');
    return token;
  }
}
