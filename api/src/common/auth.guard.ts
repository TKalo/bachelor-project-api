import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuthSessionServiceError } from 'generated_proto/hero';
import { Observable } from 'rxjs';
import { AuthSessionService } from '../auth-session/auth-session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private service: AuthSessionService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const type = context.getType();

        if (type === 'rpc') {
          const metadata = context.getArgByIndex(1); // metadata
          const token = metadata
            .get('authentication')
            ?.toString()
            ?.replace(/^Bearer\s/, '');

          await this.service.refreshTokenGuard(token);

          resolve(true);
        }

        reject(
          new RpcException({
            code: 12,
            message: 'Rpc protocol required for authentication',
          }),
        );
      } catch (e) {
        reject(
          new RpcException({
            code: 16,
            message:
              AuthSessionServiceError[
                AuthSessionServiceError.AUTH_SESSION_INVALID_REFRESH_TOKEN
              ],
          }),
        );
      }
    });
  }
}
