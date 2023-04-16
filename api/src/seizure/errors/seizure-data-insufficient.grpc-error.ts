import { RpcException } from "@nestjs/microservices";
import { SeizureServiceErrors } from "generated_proto/hero";

export class SeizureDataInsufficientGrpcError extends RpcException {
    constructor() {
      super({
        code: 6,
        message:
        SeizureServiceErrors[
            SeizureServiceErrors.SEIZURE_NEGATIVE_DURATION
          ],
      });
    }
  }
  