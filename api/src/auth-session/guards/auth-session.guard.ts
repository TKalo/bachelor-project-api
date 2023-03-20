import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { AuthSessionService } from "../auth-session.service";


@Injectable()
export class AuthSessionGuard implements CanActivate{

    constructor(private  service: AuthSessionService) {

    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const type = context.getType();
        const prefix = "Bearer ";
        let header;
        if(type==='rpc'){
            const metadata = context.getArgByIndex(1); // metadata
            if (metadata == null) {
                return false;
            }
            header = metadata.get('Authorization')[0];
        }
        
        if (!header || !header.includes(prefix)) {
            return false;
        }

        const token = header.slice(header.indexOf(' ') + 1);
        try {
            this.service.refreshTokenGuard(token);
            return true;
        } catch (e) {
            return false;
        }
    }
}