import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Collection, MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { AuthGuard } from 'src/common/auth.guard';
import { MongoModule, MongoService } from '../../common/mongo.service';
import { AuthSessionPersistenceService } from '../auth-session.persistence';
import { AuthSessionService } from '../auth-session.service';
import { AuthSessionGuard } from '../guards/auth-session.guard';
import { AuthSession } from '../types/auth-session.entity';

export interface TestContext {
  mongoClient: MongoClient;
  mongoServer: MongoMemoryReplSet;
  collection: Collection<AuthSession>;
  t: TestingModule;
}

export async function init(): Promise<TestContext> {
  let mongoClient: MongoClient;
  let mongoServer: MongoMemoryReplSet;
  let collection: Collection<AuthSession>;
  // Create a new MongoDB client and connect to the in-memory MongoDB server
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { storageEngine: 'wiredTiger' },
  });
  const mongoUri = mongoServer.getUri();
  mongoClient = await MongoClient.connect(mongoUri, {});
  collection = mongoClient.db('db').collection('collection');

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
      AuthSessionService,
      AuthSessionPersistenceService,
      MongoService,
    ],
  });

  builder.overrideProvider(MongoService).useValue({
    getCollection: (collectionName: string) => {
      return collection;
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
    collection: collection,
    t: module,
  };
}
