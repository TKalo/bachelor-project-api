import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { InvalidProtocolGrpcError } from '../../common/errors/invalid-protocol.grpc-error';
import { GrpcService } from '../../common/services/grpc.service';
import { JwtHandlerService } from '../../common/services/jwt.service';
import { ProfileExistGrpcError } from '../errors/profile-exist.grpc-error';
import { ProfilePersistenceService } from '../profile.persistence';

@Injectable()
export class HasNoProfileGuard implements CanActivate {
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

        if (profile) reject(new ProfileExistGrpcError());

        resolve(true);
      } catch (e) {
        reject(new ProfileExistGrpcError());
      }
    });
  }
}
