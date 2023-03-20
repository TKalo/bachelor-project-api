import { ObjectId } from 'mongodb';

import { AuthSessionPersistenceService } from '../auth-session.persistence';
import { init, TestContext } from './auth-session.test-environment';

describe('AuthSessionPersistenceService', () => {
  let service: AuthSessionPersistenceService;
  let env: TestContext;
  const token = "token"

  beforeAll(async () => {
    env = await init();
    service = env.t.get<AuthSessionPersistenceService>(AuthSessionPersistenceService);
  });


  afterAll(async () => {
    await env.mongoClient.close();
    await env.mongoServer.stop();
  });

  afterEach(async () => {
    await env.collection.deleteMany({});
  });

  it('create session', async () => {
    let session = await service.getSessionFromToken(token);

    expect(session == null).toBeTruthy();

    await service.createSession(new ObjectId(), token, new Date());

    session = await service.getSessionFromToken(token);

    expect(session != null).toBeTruthy();
  });

  it('delete session', async () => {
    await service.createSession(new ObjectId(), token, new Date());

    let session = await service.getSessionFromToken(token);

    expect(session != null).toBeTruthy();

    await service.deleteSession(token);

    session = await service.getSessionFromToken(token);

    expect(session == null).toBeTruthy();
  });
});
