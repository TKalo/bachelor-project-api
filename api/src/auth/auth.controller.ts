import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  AuthServiceError, AuthTokens,
  Credentials
} from '../../generated_proto/hero';

import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { EmailTakenError } from './errors/email-taken.error';
import { UserNotFoundError } from './errors/user-not-found.error';
import { WrongPasswordError } from './errors/wrong-password.error';

@Controller()
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  constructor(private readonly authSessionService: AuthService) {}
  signUp(
    request: Credentials,
  ): AuthTokens | Promise<AuthTokens> | Observable<AuthTokens> {
    return new Promise<AuthTokens>(async (resolve, reject) => {
      try {
        const tokens = await this.authSessionService.signUp(
          request.email,
          request.password,
        );
        resolve({
          refreshToken: tokens.refreshToken,
          accessToken: tokens.accessToken,
        });
      } catch (e) {
        if (e instanceof EmailTakenError) {
          reject(
            new RpcException({
              code: 6,
              message: AuthServiceError[AuthServiceError.AUTH_EMAIL_TAKEN],
            }),
          );
        } else {
          reject(
            new RpcException({
              code: 13,
              message: AuthServiceError[AuthServiceError.AUTH_INTERNAL],
            }),
          );
        }
      }
    });
  }
  signIn(
    request: Credentials,
  ): AuthTokens | Promise<AuthTokens> | Observable<AuthTokens> {
    return new Promise<AuthTokens>(async (resolve, reject) => {
      try {
        const tokens = await this.authSessionService.signIn(
          request.email,
          request.password,
        );
        resolve({
          refreshToken: tokens.refreshToken,
          accessToken: tokens.accessToken,
        });
      } catch (e) {
        if (e instanceof UserNotFoundError) {
          reject(
            new RpcException({
              code: 6,
              message: AuthServiceError[AuthServiceError.AUTH_USER_NOT_FOUND],
            }),
          );
        } else if (e instanceof WrongPasswordError) {
          reject(
            new RpcException({
              code: 7,
              message: AuthServiceError[AuthServiceError.AUTH_WRONG_PASSWORD],
            }),
          );
        } else {
          reject(
            new RpcException({
              code: 13,
              message: AuthServiceError[AuthServiceError.AUTH_INTERNAL],
            }),
          );
        }
      }
    });
  }
}
