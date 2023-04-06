import { Controller } from '@nestjs/common';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  AuthTokens,
  Credentials
} from '../../generated_proto/hero';

import { RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { EmailTakenError } from './errors/email-taken.error';
import { EmailTakenGrpcError } from './errors/email-taken.grpc-error';
import { UserNotFoundError } from './errors/user-not-found.error';
import { UserNotFoundGrpcError } from './errors/user-not-found.grpc-error';
import { WrongPasswordError } from './errors/wrong-password.error';
import { WrongPasswordGrpcError } from './errors/wrong-password.grpc-error';

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
        if (e.message === new UserNotFoundError().message) {
          reject(new UserNotFoundGrpcError());
        } 
        else if (e.message === new EmailTakenError().message) {
          reject(new EmailTakenGrpcError());
        } else {
          reject(new RpcException(e));
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
      } catch (e: any) {
        if (e.message == new UserNotFoundError().message) {
          reject(new UserNotFoundGrpcError());
        } else if (e.message == new WrongPasswordError().message) {
          reject(new WrongPasswordGrpcError());
        } else {
          reject(new RpcException(e));
        }
      }
    });
  }
}
