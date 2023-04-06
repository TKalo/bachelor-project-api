import { RpcException } from '@nestjs/microservices';
import { AuthServiceError } from 'generated_proto/hero';

export class AuthInternalGrpcError extends RpcException {
  constructor() {
    super({
      code: 13,
      message: AuthServiceError[AuthServiceError.AUTH_INTERNAL],
    });
  }
}
