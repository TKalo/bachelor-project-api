import { RpcException } from '@nestjs/microservices';
import { ProfileServiceError } from 'generated_proto/hero';

export class ProfileInternalGrpcError extends RpcException {
  constructor() {
    super({
      code: 13,
      message: ProfileServiceError[ProfileServiceError.PROFILE_INTERNAL],
    });
  }
}
