import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import { Controller, UseGuards } from '@nestjs/common';
import {
  AuthSessionServiceController,
  AuthSessionServiceControllerMethods,
  AuthTokens,
  Void
} from 'generated_proto/hero';

import { Observable } from 'rxjs';
import { GrpcService } from 'src/common/services/grpc.service';
import { AuthSessionService } from './auth-session.service';
import { AuthSessionInternalGrpcError } from './errors/auth-session-internal.grpc-error';
import { AuthGuard } from './guards/auth.guard';

@Controller()
@AuthSessionServiceControllerMethods()
export class AuthSessionController implements AuthSessionServiceController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly grpcService: GrpcService,
  ) {}

  @UseGuards(AuthGuard)
  signOut(
    request: Void,
    metadata: Metadata,
  ): Void | Observable<Void> | Promise<Void> {
    return new Promise(async (resolve, reject) => {
      const refreshToken = this.grpcService.extractToken(metadata);

      try {
        await this.authSessionService.signOut(refreshToken);
        resolve({});
      } catch (e) {
        reject(new AuthSessionInternalGrpcError());
      }
    });
  }

  @UseGuards(AuthGuard)
  refreshAccessToken(
    request: Void,
    metadata: Metadata,
  ): AuthTokens | Observable<AuthTokens> | Promise<AuthTokens> {
    return new Promise(async (resolve, reject) => {
      const refreshToken = this.grpcService.extractToken(metadata);

      try {
        const accessToken = await this.authSessionService.refreshAccessToken(
          refreshToken,
        );

        resolve({
          accessToken: accessToken,
          refreshToken: accessToken,
        });
      } catch (e) {
        reject(new AuthSessionInternalGrpcError());
      }
    });
  }
}
