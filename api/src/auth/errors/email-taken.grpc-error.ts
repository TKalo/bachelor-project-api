import { RpcException } from '@nestjs/microservices';
import { AuthServiceError } from 'generated_proto/hero';

export class EmailTakenGrpcError extends RpcException {
  constructor() {
    super({
      code: 6,
      message: AuthServiceError[AuthServiceError.AUTH_EMAIL_TAKEN],
    });
  }
}
