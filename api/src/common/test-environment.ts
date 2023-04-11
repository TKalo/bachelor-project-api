import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Db, MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { AuthSessionPersistenceService } from '../auth-session/auth-session.persistence';
import { AuthSessionService } from '../auth-session/auth-session.service';
import { AuthPersistenceService } from '../auth/auth.persistence';
import { AuthService } from '../auth/auth.service';
import { MongoModule, MongoService } from './services/mongo.service';
import { ProfileService } from '../profile/profile.service';
import { ProfilePersistenceService } from '../profile/profile.persistence';
import { JwtHandlerService } from './services/jwt.service';
import { SeizurePersistenceService } from '../seizure/seizure.persistence';

export interface TestContext {
  mongoClient: MongoClient;
  mongoServer: MongoMemoryReplSet;
  t: TestingModule;
}

export async function init(): Promise<TestContext> {
  let mongoClient: MongoClient;
  let mongoServer: MongoMemoryReplSet;
  let db: Db;

  // Create a new MongoDB client and connect to the in-memory MongoDB server
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { storageEngine: 'wiredTiger' },
  });
  const mongoUri = mongoServer.getUri();
  mongoClient = await MongoClient.connect(mongoUri, {});
  db = mongoClient.db('test');

  // Create a new testing module
  const builder = Test.createTestingModule({
    imports: [
      MongoModule,
      ConfigModule,
      JwtModule.register({
        secret: 'SECRET',
        signOptions: {
          expiresIn: 300,
        },
      }),
    ],
    providers: [
      AuthService,
      AuthPersistenceService,
      AuthSessionService,
      AuthSessionPersistenceService,
      ProfileService,
      ProfilePersistenceService,
      SeizurePersistenceService,
      JwtHandlerService,
      MongoService,
    ],
  });

  builder.overrideProvider(MongoService).useValue({
    getCollection: (collectionName: string) => {
      return db.collection(collectionName);
    },
  });

  builder.overrideProvider(ConfigService).useValue({
    getOrThrow: (key: string) => {
      switch (key) {
        case 'AUTH_SESSION_EXPIRATION_DAYS':
          return 10;
        default:
          return process.env[key];
      }
    },
  });

  const module = await builder.compile();

  return {
    mongoClient: mongoClient,
    mongoServer: mongoServer,
    t: module,
  };
}
