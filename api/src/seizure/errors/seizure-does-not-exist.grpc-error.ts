import { RpcException } from "@nestjs/microservices";
import { SeizureServiceError } from "generated_proto/hero";

export class SeizureDoesNotExistGrpcError extends RpcException {
    constructor() {
      super({
        code: 5,
        message:
        SeizureServiceError[
            SeizureServiceError.SEIZURE_DOES_NOT_EXIST
          ],
      });
    }
  }
  