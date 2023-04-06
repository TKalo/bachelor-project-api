import { RpcException } from "@nestjs/microservices";
import { ProfileServiceError } from "generated_proto/hero";

export class ProfileDoesNotExistGrpcError extends RpcException {
    constructor() {
      super({
        code: 5,
        message:
          ProfileServiceError[
            ProfileServiceError.PROFILE_DOES_NOT_EXIST
          ],
      });
    }
  }
  