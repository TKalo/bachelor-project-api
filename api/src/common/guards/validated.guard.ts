import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { InvalidAccessTokenGrpcError } from '../errors/invalid-access-token.grpc-error';
import { InvalidProtocolGrpcError } from '../errors/invalid-protocol.grpc-error';
import { GrpcService } from '../services/grpc.service';
import { JwtHandlerService } from '../services/jwt.service';

@Injectable()
export class ValidatedGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtHandlerService,
    private readonly grpcService: GrpcService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      const type = context.getType();

      if (type !== 'rpc') {
        reject(new InvalidProtocolGrpcError());
      }
      const metadata = context.getArgByIndex(1); // metadata
      const token = this.grpcService.extractToken(metadata);

      const validated = this.jwtService.validateAccessToken(token);

      if (!validated) reject(new InvalidAccessTokenGrpcError());

      resolve(true);
    });
  }
}
