import { RpcException } from '@nestjs/microservices';
import { AuthServiceError } from 'generated_proto/hero';

export class UserNotFoundGrpcError extends RpcException {
  constructor() {
    super({
        code: 16,
        message: AuthServiceError[AuthServiceError.AUTH_USER_NOT_FOUND],
      });
  }
}
