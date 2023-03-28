import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import { Controller, UseGuards } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  AuthSessionServiceController,
  AuthSessionServiceControllerMethods,
  AuthSessionServiceError, AuthTokens, Void
} from 'generated_proto/hero';

import { Observable } from 'rxjs';
import { AuthGuard } from '../common/auth.guard';
import { AuthSessionService } from './auth-session.service';

@Controller()
@AuthSessionServiceControllerMethods()
export class AuthSessionController implements AuthSessionServiceController {
  constructor(private readonly authSessionService: AuthSessionService) {}

  @UseGuards(AuthGuard)
  signOut(
    request: Void,
    metadata: Metadata,
  ): Void | Observable<Void> | Promise<Void> {
    return new Promise(async (resolve, reject) => {
      const authToken = metadata
        .get('authentication')
        ?.toString()
        ?.replace(/^Bearer\s/, '');

      try {
        await this.authSessionService.signOut(authToken);
        resolve({});
      } catch (e) {
        reject(
          new RpcException({
            code: 13,
            message:
              AuthSessionServiceError[
                AuthSessionServiceError.AUTH_SESSION_INTERNAL
              ],
          }),
        );
      }
    });
  }

  @UseGuards(AuthGuard)
  refreshAccessToken(
    request: Void,
    metadata: Metadata,
  ): AuthTokens | Observable<AuthTokens> | Promise<AuthTokens> {
    return new Promise(async (resolve, reject) => {
      const authToken = metadata
        .get('authentication')
        ?.toString()
        ?.replace(/^Bearer\s/, '');

      try {
        const token = await this.authSessionService.refreshAccessToken(
          authToken,
        );

        resolve({
          accessToken: token,
          refreshToken: authToken,
        });
      } catch (e) {
        reject(
          new RpcException({
            code: 13,
            message:
              AuthSessionServiceError[
                AuthSessionServiceError.AUTH_SESSION_INTERNAL
              ],
          }),
        );
      }
    });
  }
}
