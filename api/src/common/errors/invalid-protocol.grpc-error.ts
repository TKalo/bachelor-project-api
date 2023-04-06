import { RpcException } from '@nestjs/microservices';

export class InvalidProtocolGrpcError extends RpcException {
  constructor() {
    super({
      code: 12,
      message: 'Rpc protocol required for authentication',
    });
  }
}
