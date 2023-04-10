import { JwtService } from '@nestjs/jwt';
import { Collection, ObjectId } from 'mongodb';
import { MongoService } from '../../common/services/mongo.service';
import { init, TestContext } from '../../common/test-environment';

import { AuthSessionService } from '../auth-session.service';
import { InvalidRefreshTokenError } from '../errors/invalid-refresh-token.error';
import { AuthSession } from '../types/auth-session.entity';

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let context: TestContext;
  let jwtService: JwtService;
  let collection: Collection<AuthSession>;

  beforeAll(async () => {
    context = await init();
    service = context.t.get<AuthSessionService>(AuthSessionService);
    jwtService = context.t.get<JwtService>(JwtService);
    const mongoService = context.t.get<MongoService>(MongoService);
    collection = mongoService.getCollection(AuthSession.name)
  });

  afterAll(async () => {
    await context.mongoClient.close();
    await context.mongoServer.stop();
  });

  afterEach(async () => {
    await collection.deleteMany({});
  });

  it('createSession - when userid not associated with existing auth session is given, expect session to be created', async () => {
    const userId = new ObjectId();
    const tokens = await service.createSession(userId);

    expect(tokens != null).toBeTruthy();

    const session = await collection.findOne({
      userId: userId,
    });

    expect(session != null).toBeTruthy();

    expect(session.refreshToken).toBe(tokens.refreshToken);

    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

    expect(session.expiresAt.getDate()).toBe(tenDaysFromNow.getDate());
  });

  it('signOut - when token exists, should remove session', async () => {
    const userId = new ObjectId();
    const tokens = await service.createSession(userId);

    expect(tokens != null).toBeTruthy();

    let session = await collection.findOne({
      userId: userId,
    });

    expect(session != null).toBeTruthy();

    await service.signOut(tokens.refreshToken);

    session = await collection.findOne({
      userId: userId,
    });

    expect(session == null).toBeTruthy();
  });

  it('signOut - when token does not exist, should act as if it was removed', async () => {
    const token = "non existing token";

    await service.signOut(token);

    const session = await collection.findOne({
      refreshToken: token,
    });

    expect(session == null).toBeTruthy();
  });


  it('refreshAccessToken - when token is valid, should return accessToken', async () => {
    const userId = new ObjectId();
    const tokens = await service.createSession(userId);

    expect(tokens != null).toBeTruthy();

    const session = await collection.findOne({
      userId: userId,
    });

    expect(session != null).toBeTruthy();

    const jwt = await service.refreshAccessToken(tokens.refreshToken);

    const decodedJwt = jwtService.verify(jwt);

    expect(decodedJwt.userId).toBe(userId.toHexString())
  });

  it('refreshTokenGuard - When token is invalid, should throw error', async () => {
    const token = "invalid token"

    const refreshTokenGuard = async () => {
      await service.refreshTokenGuard(token);
    };

    expect(refreshTokenGuard()).rejects.toThrowError(InvalidRefreshTokenError);
  });

  it('refreshTokenGuard - When token is expired, should throw error', async () => {
    const token = "valid"
    const expiration = new Date();

    collection.insertOne({
      userId: new ObjectId(),
      refreshToken: token,
      expiresAt: expiration
    })

    const refreshTokenGuard = async () => {
      await service.refreshTokenGuard(token);
    };

    expect(refreshTokenGuard()).rejects.toThrowError(InvalidRefreshTokenError);
  });

  it('refreshTokenGuard - When token is valid, should complete without error', async () => {
    const userId = new ObjectId();
    const tokens = await service.createSession(userId);

    expect(tokens != null).toBeTruthy();

    const session = await collection.findOne({
      userId: userId,
    });

    expect(session != null).toBeTruthy();

    const refreshTokenGuard = async () => {
      await service.refreshTokenGuard(tokens.refreshToken);
    };

    expect(refreshTokenGuard()).resolves.not.toThrowError()
  });
});
