import { RpcException } from '@nestjs/microservices';
import { ValidationError } from 'generated_proto/hero';

export class InvalidAccessTokenGrpcError extends RpcException {
  constructor() {
    super({
      code: 16,
      message:
        ValidationError[ValidationError.VALIDATION_INVALID_ACCESS_TOKEN],
    });
  }
}
