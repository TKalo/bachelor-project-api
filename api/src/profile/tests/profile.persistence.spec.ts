import { Collection, ObjectId } from 'mongodb';
import { JwtHandlerService } from '../../common/services/jwt.service';
import { MongoService } from '../../common/services/mongo.service';
import { TestContext, init } from '../../common/test-environment';
import { ProfilePersistenceService } from '../profile.persistence';
import { ProfileChange } from '../types/profile-change.entity';
import { Profile } from '../types/profile.entity';

describe('ProfilePersistenceService', () => {
  let service: ProfilePersistenceService;
  let context: TestContext;
  let collection: Collection<Profile>;
  let jwtService: JwtHandlerService;

  beforeAll(async () => {
    context = await init();
    service = context.t.get<ProfilePersistenceService>(
      ProfilePersistenceService,
    );
    jwtService = context.t.get<JwtHandlerService>(JwtHandlerService);

    const mongoService = context.t.get<MongoService>(MongoService);
    collection = mongoService.getCollection(Profile.name);
  });

  afterAll(async () => {
    await context.mongoClient.close();
    await context.mongoServer.stop();
    await context.t.close();
  });

  afterEach(async () => {
    await collection.deleteMany({});
  });

  it('createProfile - when valid input is given, should add profile to database', async () => {
    const userId = new ObjectId();
    const name = 'John Doe';

    await service.create(userId, name);

    const profile = await collection.findOne({ _id: userId });

    expect(profile).toBeDefined();
    expect(profile._id).toEqual(userId);
    expect(profile.name).toEqual(name);
  });

  it('updateProfile - when valid input is given, should update profile in database', async () => {
    const result = await collection.insertOne({ _id: null, name: 'John Doe' });

    const name = 'Jane Doe';

    await service.update(result.insertedId, name);

    const profile = await collection.findOne({ _id: result.insertedId });

    expect(profile).toBeDefined();
    expect(profile._id).toEqual(result.insertedId);
    expect(profile.name).toEqual(name);
  });

  it('getProfile - when profile exist in database, should return profile', async () => {
    const name = 'John Doe';
    const result = await collection.insertOne({ _id: null, name: name });

    const token = jwtService.generateAccessToken(result.insertedId);
    const id = jwtService.decodeAccessToken(token);

    const profile = await service.get(id);

    expect(profile).toBeDefined();
    expect(profile._id).toEqual(result.insertedId);
    expect(profile.name).toEqual(name);
  });

  //TODO TEST STREAM OF OBJECTS YOU SHOULD NOT SEE

  it('streamProfile - should emit a CREATE event when a new profile is created', async () => {
    const userId = new ObjectId();
    const name = 'John Doe';

    const stream = service.stream(userId);
    const emittedEvents: any[] = [];

    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await service.create(userId, name);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(1);
    expect(emittedEvents[0].change).toEqual(0); // ChangeType.CREATE
    expect(emittedEvents[0].profile._id).toEqual(userId);
    expect(emittedEvents[0].profile.name).toEqual(name);

    stream.complete();
  });

  it('streamProfile - should emit an UPDATE event when a profile is updated', async () => {
    const userId = new ObjectId();
    const name = 'John Doe';
    const newName = 'Jane Doe';

    await service.create(userId, name);

    const emittedEvents: ProfileChange[] = [];
    const stream = service.stream(userId);
    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await service.update(userId, newName);

    await new Promise((resolve) => setTimeout(resolve, 100));

    stream.complete();

    expect(emittedEvents.length).toBe(1);
    expect(emittedEvents[0].change).toBe(1); // ChangeType.UPDATE
    expect(emittedEvents[0].profile._id).toEqual(userId);
    expect(emittedEvents[0].profile.name).toEqual(newName);
  });

  it('stream - When other user changes data, should not return event', async () => {
    // Arrange
    const userId = new ObjectId();
    const otherUserId = new ObjectId();
    const name = 'John Doe';
    const newName = 'Jane Doe';

    await collection.insertOne({
      _id: userId,
      name: name,
    });

    await collection.insertOne({
      _id: otherUserId,
      name: name,
    });

    const stream = service.stream(userId);
    const emittedEvents: ProfileChange[] = [];

    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await collection.updateOne(
      { userId: otherUserId },
      { $set: { name: newName } },
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(0);

    stream.complete();
  });
});
