import { RpcException } from "@nestjs/microservices";
import { SeizureServiceError } from "generated_proto/hero";

export class SeizureDataInsufficientGrpcError extends RpcException {
    constructor() {
      super({
        code: 6,
        message:
        SeizureServiceError[
            SeizureServiceError.SEIZURE_NEGATIVE_DURATION
          ],
      });
    }
  }
  