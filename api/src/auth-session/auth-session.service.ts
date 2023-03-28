import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DateTime, Duration } from 'luxon';
import { ObjectId } from 'mongodb';
import { AuthSessionPersistenceService } from './auth-session.persistence';
import { InvalidRefreshTokenError } from './errors/invalid-refresh-token.error';
import { AuthSession } from './types/auth-session.entity';
import { AuthTokens } from './types/auth-tokens.entity';
const crypto = require('crypto');

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly persistence: AuthSessionPersistenceService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signOut(token: string) {
    await this.persistence.deleteSession(token);
  }

  async refreshAccessToken(token: string) {
    const session = await this.persistence.getSessionFromToken(token);

    const userId = session.userId;

    return this.generateAccessToken(userId);
  }

  private generateAccessToken(userId: ObjectId): string {
    return this.jwtService.sign({
      userId: userId.toHexString(),
    });
  }

  async createSession(userId: ObjectId): Promise<AuthTokens> {
    const refreshToken = await this.generateRefreshToken();
    const expirationDays = this.configService.getOrThrow(
      'AUTH_SESSION_EXPIRATION_DAYS',
    );
    const expiration = DateTime.now()
      .plus(
        Duration.fromObject({
          day: expirationDays,
        }),
      )
      .toJSDate();

    await this.persistence.createSession(
      userId,
      refreshToken,
      expiration,
    );

    const accessToken = this.generateAccessToken(userId);

    return {
      refreshToken: refreshToken,
      accessToken: accessToken,
    };
  }

  private async generateRefreshToken(): Promise<string> {
    let token = '';

    do {
      token = crypto.randomBytes(16).toString('hex');
    } while (await this.persistence.getSessionFromToken(token) != null);

    return token;
  }

  async refreshTokenGuard(token: string): Promise<void> {
    let session: AuthSession;
    try{
      session = await this.persistence.getSessionFromToken(token);
    }catch(e){
      throw new InvalidRefreshTokenError();
    }
    if (session == null) throw new InvalidRefreshTokenError();
    if(session.expiresAt < new Date()) throw new InvalidRefreshTokenError();
  }
}
