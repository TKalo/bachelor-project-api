import { RpcException } from "@nestjs/microservices";
import { ProfileServiceError } from "generated_proto/hero";

export class ProfileDataInsufficientGrpcError extends RpcException {
    constructor() {
      super({
        code: 6,
        message:
          ProfileServiceError[
            ProfileServiceError.PROFILE_DATA_INSUFFICIENT
          ],
      });
    }
  }
  