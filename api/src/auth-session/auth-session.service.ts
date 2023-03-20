import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DateTime, Duration } from 'luxon';
import { ObjectId } from 'mongodb';
import { AuthSessionPersistenceService } from './auth-session.persistence';
const crypto = require('crypto');

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly persistence: AuthSessionPersistenceService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signOut(token: string) {
    await this.refreshTokenGuard(token);

    this.persistence.deleteSession(token);
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

  async createSession(userId: ObjectId): Promise<string> {
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

    return refreshToken;
  }

  private async generateRefreshToken(): Promise<string> {
    let token = '';

    do {
      token = crypto.randomBytes(16).toString('hex');
    } while (await this.persistence.getSessionFromToken(token) != null);

    return token;
  }

  async refreshTokenGuard(token: string): Promise<void> {
    const session = await this.persistence.getSessionFromToken(token);

    if (session == null) throw new Error('invalid refresh token');
  }
}
