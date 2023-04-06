import { Collection, ObjectId } from 'mongodb';
import { MongoService } from '../../common/services/mongo.service';
import { init, TestContext } from '../../common/test-environment';

import { AuthSessionPersistenceService } from '../auth-session.persistence';
import { AuthSession } from '../types/auth-session.entity';

describe('AuthSessionPersistenceService', () => {
  let service: AuthSessionPersistenceService;
  let context: TestContext;
  const token = "token"
  let collection: Collection<AuthSession>;
  
  beforeAll(async () => {
    context = await init();
    service = context.t.get<AuthSessionPersistenceService>(AuthSessionPersistenceService);
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
