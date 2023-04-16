import { RpcException } from '@nestjs/microservices';
import { SeizureServiceErrors } from 'generated_proto/hero';

export class SeizureInternalGrpcError extends RpcException {
  constructor() {
    super({
      code: 13,
      message: SeizureServiceErrors[SeizureServiceErrors.SEIZURE_INTERNAL],
    });
  }
}
