import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import { Controller, UseGuards } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  AuthTokens,
  AuthSessionServiceController,
  AuthSessionServiceControllerMethods,
  AuthSessionServiceError,
  Void,
} from 'generated_proto/hero';

import { Observable } from 'rxjs';
import { AuthGuard } from 'src/common/auth.guard';
import { AuthSessionService } from './auth-session.service';
import { AuthSessionGuard } from './guards/auth-session.guard';

@Controller()
@AuthSessionServiceControllerMethods()
export class AuthSessionController implements AuthSessionServiceController {
  constructor(private readonly authSessionService: AuthSessionService) {}

  @UseGuards(AuthGuard)
  signOut(
    request: Void,
    metadata: Metadata,
  ): Void | Observable<Void> | Promise<Void> {
    return new Promise(async () => {
      const authToken = metadata
        .get('authentication')
        ?.toString()
        ?.replace(/^Bearer\s/, '');

      try {
        await this.authSessionService.signOut(authToken);
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
    metadata: Metadata,
  ): AuthTokens | Observable<AuthTokens> | Promise<AuthTokens> {
    return new Promise(async () => {
      const authToken = metadata
        .get('authentication')
        ?.toString()
        ?.replace(/^Bearer\s/, '');

      try {
        const token = await this.authSessionService.refreshAccessToken(authToken);
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
