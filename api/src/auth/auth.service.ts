import { Injectable } from '@nestjs/common';
import { Credentials } from 'generated_proto/hero';
import { AuthSessionService } from '../auth-session/auth-session.service';
import { AuthTokens } from '../auth-session/types/auth-tokens.entity';
import { AuthPersistenceService } from './auth.persistence';
import { UserNotFoundError } from './errors/user-not-found.error';
import { WrongPasswordError } from './errors/wrong-password.error';
var bcrypt = require('bcrypt')

@Injectable()
export class AuthService {
  constructor(
    private readonly persistence: AuthPersistenceService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  async signUp(email: string, password: string): Promise<AuthTokens> {
    const salt = bcrypt.genSaltSync(4);
    const hash = bcrypt.hashSync(password, salt);

    const user = await this.persistence.createUser(email, hash, salt);
    const session = await this.authSessionService.createSession(user._id);
    return session;
  }

  async signIn(email: string, password: string): Promise<AuthTokens> {


      const user = await this.persistence.getUserFromEmail(email);
      if (user == null) throw new UserNotFoundError();

      const hash = bcrypt.hashSync(password, user.salt);
      if (hash !== user.password) throw new WrongPasswordError()

      const session = await this.authSessionService.createSession(user._id);

      return session;

  }
}
