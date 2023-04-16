import { Injectable } from '@nestjs/common';

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
