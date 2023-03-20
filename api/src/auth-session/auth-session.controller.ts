import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import { Controller, UseGuards } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuthTokens, AuthSessionServiceController, AuthSessionServiceControllerMethods, AuthSessionServiceError, Void } from 'generated_proto/hero';

import { Observable } from 'rxjs';
import { AuthGuard } from 'src/common/auth.guard';
import { AuthSessionService } from './auth-session.service';
import { AuthSessionGuard } from './guards/auth-session.guard';


@Controller()
@AuthSessionServiceControllerMethods()
export class AuthSessionController implements AuthSessionServiceController {
  constructor(private readonly authSessionService: AuthSessionService) {}

  @UseGuards(AuthGuard)  
  signOut(request: Void, metadata: Metadata): Void | Observable<Void> | Promise<Void> {
    return new Promise(async () => {
      const meta = metadata.getMap();
      const authHeader = meta['authentication'];
      const token = authHeader ? authHeader[0] : undefined;


      try {
        await this.authSessionService.signOut(token[0]);
        return {};
      } catch (e) {
        throw new RpcException(
          AuthSessionServiceError.INTERNAL_ERROR.toLocaleString(),
        );
      }
    });
  }

  @UseGuards(AuthSessionGuard)
  refreshAccessToken(
    request: Void,
  ): AuthTokens | Observable<AuthTokens> | Promise<AuthTokens> {
    return new Promise(async () => {
      try {
        const token = await this.authSessionService.refreshAccessToken(
          "",
        );
        return {
          token: token,
        };
      } catch (e) {
        throw new RpcException(
          AuthSessionServiceError.INTERNAL_ERROR.toLocaleString(),
        );
      }
    });
  }
}
