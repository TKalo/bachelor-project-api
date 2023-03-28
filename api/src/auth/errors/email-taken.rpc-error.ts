import { RpcException } from "@nestjs/microservices";


export class EmailTakenRpcError extends RpcException {
    constructor() {
        super('email-taken');
        this.message = "email-taken-message";
        this.name =  "email-taken-name";
      }
}