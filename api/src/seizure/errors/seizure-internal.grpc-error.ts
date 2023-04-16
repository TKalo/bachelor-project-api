import { RpcException } from '@nestjs/microservices';
import { SeizureServiceError } from 'generated_proto/hero';

export class SeizureInternalGrpcError extends RpcException {
  constructor() {
    super({
      code: 13,
      message: SeizureServiceError[SeizureServiceError.SEIZURE_INTERNAL],
    });
  }
}
