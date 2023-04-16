import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ProfilePersistenceService } from '../profile.persistence';
import { InvalidProtocolGrpcError } from '../../common/errors/invalid-protocol.grpc-error';
import { ProfileDoesNotExistGrpcError } from '../errors/profile-does-not-exist.grpc-error';
import { GrpcService } from '../../common/services/grpc.service';
import { JwtHandlerService } from '../../common/services/jwt.service';

@Injectable()
export class HasProfileGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtHandlerService,
    private readonly grpcService: GrpcService,
    private readonly persistence: ProfilePersistenceService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const type = context.getType();

        if (type !== 'rpc') reject(new InvalidProtocolGrpcError());

        const metadata = context.getArgByIndex(1); // metadata
        const accessToken = this.grpcService.extractToken(metadata);
        const userId = this.jwtService.decodeAccessToken(accessToken);
        const profile = await this.persistence.get(userId);

        if (!profile) reject(new ProfileDoesNotExistGrpcError());

        resolve(true);
      } catch (e) {
        reject(new ProfileDoesNotExistGrpcError());
      }
    });
  }
}
