import { CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";

export class AuthGuard implements CanActivate{

    constructor(private  jwtService: JwtService) {

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
            this.jwtService.verify(token);
            return true;
        } catch (e) {
            return false;
        }
    }
}