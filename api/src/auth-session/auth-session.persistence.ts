import { Injectable, OnModuleInit } from '@nestjs/common';
import { Collection, ObjectId } from 'mongodb';
import { AuthSession } from './types/auth-session.entity';
import { MongoService } from '../common/services/mongo.service';

@Injectable()
export class AuthSessionPersistenceService implements OnModuleInit {
  private readonly authSessionCollection: Collection<AuthSession>
  constructor(
    private readonly mongoService: MongoService, //
  ) {
    this.authSessionCollection = mongoService.getCollection<AuthSession>(AuthSession.name);
  }

  async onModuleInit() {
    await this.authSessionCollection.createIndex(
      { refreshToken: 1 },
      { unique: true },
    );
  }

  async createSession(
    userId: ObjectId,
    refreshToken: string,
    expiration: Date,
  ) {
    await this.authSessionCollection.insertOne({
      userId: userId,
      refreshToken: refreshToken,
      expiresAt: expiration,
    });
  }

  async deleteSession(refreshToken: string) {
    await this.authSessionCollection.deleteOne({ refreshToken: refreshToken });
  }

  async getSessionFromToken(refreshToken: string): Promise<AuthSession> {
    return await this.authSessionCollection.findOne({
      refreshToken: refreshToken,
    });
  }
}
