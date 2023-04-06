import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { InvalidProtocolGrpcError } from 'src/common/errors/invalid-protocol.grpc-error';
import { GrpcService } from '../../common/services/grpc.service';
import { AuthSessionService } from '../auth-session.service';
import { InvalidRefreshTokenGrpcError } from '../errors/invalid-refresh-token.grpc-error';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private service: AuthSessionService,
    private readonly grpcService: GrpcService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const type = context.getType();

        if (type !== 'rpc') {
          reject(new InvalidProtocolGrpcError());
        }

        const metadata = context.getArgByIndex(1); // metadata
        const token = this.grpcService.extractToken(metadata);
        await this.service.refreshTokenGuard(token);

        resolve(true);
      } catch (e) {
        reject(new InvalidRefreshTokenGrpcError());
      }
    });
  }
}
