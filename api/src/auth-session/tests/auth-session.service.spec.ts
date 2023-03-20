import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';

import { AuthSessionService } from '../auth-session.service';
import { init, TestContext } from './auth-session.test-environment';

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let env: TestContext;
  let jwtService: JwtService;

  beforeAll(async () => {
    env = await init();
    service = env.t.get<AuthSessionService>(AuthSessionService);
    jwtService = env.t.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await env.mongoClient.close();
    await env.mongoServer.stop();
  });

  afterEach(async () => {
    await env.collection.deleteMany({});
  });

  it('create session - when userid not associated with existing auth session is given, expect session to be created', async () => {
    const userId = new ObjectId();
    const token = await service.createSession(userId);

    expect(token != null).toBeTruthy();

    const session = await env.collection.findOne({
      userId: userId,
    });

    expect(session != null).toBeTruthy();

    expect(session.refreshToken).toBe(token);

    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

    expect(session.expiresAt.getDate()).toBe(tenDaysFromNow.getDate());
  });

  it('sign out', async () => {
    const userId = new ObjectId();
    const token = await service.createSession(userId);

    expect(token != null).toBeTruthy();

    let session = await env.collection.findOne({
      userId: userId,
    });

    expect(session != null).toBeTruthy();

    await service.signOut(token);

    session = await env.collection.findOne({
      userId: userId,
    });

    expect(session == null).toBeTruthy();
  });

  it('refresh access token - with valid token', async () => {
    const userId = new ObjectId();
    const token = await service.createSession(userId);

    expect(token != null).toBeTruthy();

    const session = await env.collection.findOne({
      userId: userId,
    });

    expect(session != null).toBeTruthy();

    const jwt = await service.refreshAccessToken(token);

    const decodedJwt = jwtService.verify(jwt);

    expect(decodedJwt.userId).toBe(userId.toHexString())
  });

  it('refreshTokenGuard - with invalid token', async () => {
    const token = "invalid token"

    const refreshTokenGuard = async () => {
      await service.refreshTokenGuard(token);
    };

    expect(refreshTokenGuard()).rejects.toThrow('invalid refresh token')
  });
});
