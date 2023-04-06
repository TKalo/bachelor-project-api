import { RpcException } from '@nestjs/microservices';
import { AuthSessionServiceError } from 'generated_proto/hero';

export class AuthSessionInternalGrpcError extends RpcException {
  constructor() {
    super({
        code: 13,
        message:
          AuthSessionServiceError[
            AuthSessionServiceError.AUTH_SESSION_INTERNAL
          ],
      });
  }
}
