import { Collection, ObjectId } from 'mongodb';
import { MongoService } from '../../common/services/mongo.service';
import { init, TestContext } from '../../common/test-environment';

import { AuthSessionPersistenceService } from '../auth-session.persistence';
import { AuthSession } from '../types/auth-session.entity';

describe('AuthSessionPersistenceService', () => {
  let persistence: AuthSessionPersistenceService;
  let context: TestContext;
  const token = "token"
  let collection: Collection<AuthSession>;
  
  beforeAll(async () => {
    context = await init();
    persistence = context.t.get<AuthSessionPersistenceService>(AuthSessionPersistenceService);
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

  it('createSession', async () => {
    let session = await persistence.getSessionFromToken(token);

    expect(session == null).toBeTruthy();

    await persistence.createSession(new ObjectId(), token, new Date());

    session = await persistence.getSessionFromToken(token);

    expect(session != null).toBeTruthy();

    //TODO: check values of session
  });

  it('deleteSession', async () => {
    await persistence.createSession(new ObjectId(), token, new Date());

    let session = await persistence.getSessionFromToken(token);

    expect(session != null).toBeTruthy();

    await persistence.deleteSession(token);

    session = await persistence.getSessionFromToken(token);

    expect(session == null).toBeTruthy();
  });
});
