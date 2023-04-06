import { Collection, ObjectId } from 'mongodb';
import { JwtHandlerService } from '../../common/services/jwt.service';
import { MongoService } from '../../common/services/mongo.service';
import { TestContext, init } from '../../common/test-environment';
import { ProfileService } from '../profile.service';
import { Profile } from '../types/profile.entity';
import { ChangeType, ProfileChange } from '../types/profile-change.entity';

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

  afterAll(async () => {
    await context.mongoClient.close();
    await context.mongoServer.stop();
  });

  afterEach(async () => {
    await collection.deleteMany({});
  });

  it('JwtHandlerService', () => {
    const id = new ObjectId();
    const accessToken = jwtService.generateAccessToken(id);
    
    const validation = jwtService.validateAccessToken(accessToken);
    expect(validation).toBe(true);

    const decodedId = jwtService.decodeAccessToken(accessToken);
    expect(decodedId.toHexString()).toBe(id.toHexString());
})

  it('createProfile', async () => {
    // Generate a fake access token and name
    const id = new ObjectId();
    const name = 'John Doe';
    const accessToken = jwtService.generateAccessToken(id);

    // Call the createProfile method
    await service.createProfile(accessToken, name);

    // Check that the profile was created in the database
    const foundProfile = await collection.findOne({ _id: id });
    expect(foundProfile).toBeDefined();
    expect(foundProfile?.name).toEqual(name);
  });

  it('updateProfile', async () => {
    // Insert a profile in the database
    const id = new ObjectId();
    const name = 'jane Doe';
    await collection.insertOne({ _id: id, name: 'John Doe' });

    // Generate a fake access token and name
    const accessToken = jwtService.generateAccessToken(id);

    // Call the updateProfile method
    await service.updateProfile(accessToken, name);

    // Check that the profile was updated in the database
    const foundProfile = await collection.findOne({ _id: id });
    expect(foundProfile).toBeDefined();
    expect(foundProfile?.name).toEqual(name);
  });

  it('getProfile', async () => {
    // Insert a profile in the database
    const id = new ObjectId();
    const name = 'John Doe';
    await collection.insertOne({ _id: id, name: name });

    // Generate a fake access token
    const accessToken = jwtService.generateAccessToken(id);

    // Call the getProfile method
    const foundProfile = await service.getProfile(accessToken);

    // Check that the returned profile matches the expected values
    expect(foundProfile).toBeDefined();
    expect(foundProfile._id).toEqual(id);
    expect(foundProfile.name).toEqual(name);
  });

  it('streamProfile - should emit a create event when a new profile is created', async () => {
    const id = new ObjectId();
    const name = 'John Doe';
    const accessToken = jwtService.generateAccessToken(id);

    const stream = service.streamProfile(accessToken);
    const profile: Profile = { _id: id, name };
    const changeType = ChangeType.CREATE;

    const emittedProfileChange = await new Promise<ProfileChange>(async (resolve) => {
      stream.subscribe({
        next: (change) => {
            resolve(change);
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      service.createProfile(accessToken, name);
    });

    expect(emittedProfileChange.profile).toEqual(profile);
    expect(emittedProfileChange.change).toEqual(changeType);

    stream.complete()
  });

  it('streamProfile - should emit an UPDATE event when a profile is updated', async () => {
    const id = new ObjectId();
    const initialName = 'John Doe';
    const updatedName = 'Jane Doe';
    const accessToken = jwtService.generateAccessToken(id);

    await service.createProfile(accessToken, initialName);

    const stream = service.streamProfile(accessToken);
    const profile: Profile = { _id: id, name: updatedName };
    const changeType = ChangeType.UPDATE;

    const emittedProfileChange = await new Promise<ProfileChange>(async (resolve) => {
      stream.subscribe({
        next: (change) => {
            resolve(change);
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      service.updateProfile(accessToken, updatedName);
    });

    expect(emittedProfileChange.profile).toEqual(profile);
    expect(emittedProfileChange.change).toEqual(changeType);

    stream.complete()
  });
});
