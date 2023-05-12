import { Collection, ObjectId } from 'mongodb';
import { JwtHandlerService } from '../../common/services/jwt.service';
import { MongoService } from '../../common/services/mongo.service';
import { TestContext, init } from '../../common/test-environment';
import { ProfileService } from '../profile.service';
import { ProfileChange } from '../types/profile-change.entity';
import { Profile } from '../types/profile.entity';

describe('ProfileService', () => {
  let service: ProfileService;
  let jwtService: JwtHandlerService;
  let context: TestContext;
  let collection: Collection<Profile>;

  beforeAll(async () => {
    context = await init();
    service = context.t.get<ProfileService>(ProfileService);
    jwtService = context.t.get<JwtHandlerService>(JwtHandlerService);
    const mongoService = context.t.get<MongoService>(MongoService);
    collection = mongoService.getCollection(Profile.name);
  });

  
  afterAll(async () => await context.mongoServer.stop());

  afterEach(async () => await collection.deleteMany({}));

  it('create - when valid AccessToken given, should add profile to database', async () => {
    // Generate a fake access token and name
    const id = new ObjectId();
    const name = 'John Doe';
    const accessToken = jwtService.generateAccessToken(id);

    // Call the createProfile method
    await service.create(accessToken, name);

    // Check that the profile was created in the database
    const foundProfile = await collection.findOne({ _id: id });
    expect(foundProfile).toBeDefined();
    expect(foundProfile?.name).toEqual(name);
  });

  it('update - when valid AccessToken given, should update profile in database', async () => {
    // Insert a profile in the database
    const id = new ObjectId();
    const name = 'jane Doe';
    await collection.insertOne({ _id: id, name: 'John Doe' });

    // Generate a fake access token and name
    const accessToken = jwtService.generateAccessToken(id);

    // Call the updateProfile method
    await service.update(accessToken, name);

    // Check that the profile was updated in the database
    const foundProfile = await collection.findOne({ _id: id });
    expect(foundProfile).toBeDefined();
    expect(foundProfile?.name).toEqual(name);
  });

  it('get - when valid AccessToken given, should return profile', async () => {
    // Insert a profile in the database
    const id = new ObjectId();
    const name = 'John Doe';
    await collection.insertOne({ _id: id, name: name });

    // Generate a fake access token
    const accessToken = jwtService.generateAccessToken(id);

    // Call the getProfile method
    const foundProfile = await service.get(accessToken);

    // Check that the returned profile matches the expected values
    expect(foundProfile).toBeDefined();
    expect(foundProfile._id).toEqual(id);
    expect(foundProfile.name).toEqual(name);
  });

  it('stream - when valid AccessToken given and profile is created, should return profileChange of type CREATE', async () => {
    const id = new ObjectId();
    const name = 'John Doe';
    const accessToken = jwtService.generateAccessToken(id);

    const stream = service.stream(accessToken);
    const emittedEvents: ProfileChange[] = [];
    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await collection.insertOne({
      _id: id,
      name: name,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(1);
    expect(emittedEvents[0].change).toEqual(0); // ChangeType.CREATE

    stream.complete();
  });

  it('stream - when valid AccessToken given and profile is updated, should return profileChange of type UPDATE', async () => {
    const id = new ObjectId();
    const startName = 'John Doe';
    const endName = 'Jane Doe';
    const accessToken = jwtService.generateAccessToken(id);

    await collection.insertOne({
      _id: id,
      name: startName,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const stream = service.stream(accessToken);
    const emittedEvents: ProfileChange[] = [];
    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await service.update(accessToken, endName)
    
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(1);
    expect(emittedEvents[0].change).toEqual(1); // ChangeType.UPDATE

    stream.complete();
  });

  
  it('stream - when other user creates profile, should not return profileChange', async () => {
    const id = new ObjectId();
    const otherId = new ObjectId();
    const name = 'John Doe';
    const accessToken = jwtService.generateAccessToken(id);

    await collection.insertOne({
      _id: otherId,
      name: name,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const stream = service.stream(accessToken);
    const emittedEvents: ProfileChange[] = [];
    stream.subscribe((event) => emittedEvents.push(event));
    
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(0);

    stream.complete();
  });
});
