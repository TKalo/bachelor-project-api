import { Collection, ObjectId } from 'mongodb';
import { MongoService } from '../../common/services/mongo.service';
import { TestContext, init } from '../../common/test-environment';

import { SeizurePersistenceService } from '../seizure.persistence';
import { Seizure, SeizureType } from '../types/Seizure.entity';
import { SeizureChange } from '../types/seizure-change.entity';

describe('SeizurePersistenceService', () => {
  let service: SeizurePersistenceService;
  let context: TestContext;
  let collection: Collection<Seizure>;

  beforeAll(async () => {
    context = await init();
    service = context.t.get<SeizurePersistenceService>(
      SeizurePersistenceService,
    );
    const mongoService = context.t.get<MongoService>(MongoService);
    collection = mongoService.getCollection(Seizure.name);
  });

  afterAll(async () => {
    await context.mongoClient.close();
    await context.mongoServer.stop();
    await context.t.close();
  });

  afterEach(async () => {
    await collection.deleteMany({});
  });

  it('create - when valid input is given, should create a new seizure', async () => {
    const userId = new ObjectId();
    const type = SeizureType.ATONIC;
    const duration = 10;

    await service.create(userId, type, duration);

    const createdSeizure = await collection.findOne({ userId });

    expect(createdSeizure).toBeDefined();
    expect(createdSeizure.userId).toEqual(userId);
    expect(createdSeizure.type).toEqual(type);
    expect(createdSeizure.duration).toEqual(duration);
  });

  it('create - when invalid input is given, should throw error', async () => {
    const userId = new ObjectId();
    const type = null;
    const duration = 10;

    await expect(service.create(userId, type, duration)).rejects.toThrow();
  });

  it('delete - when valid seizureId is given, should delete the seizure', async () => {
    const userId = new ObjectId();
    const type = SeizureType.ATONIC;
    const duration = 10;
    const createdSeizure = await collection.insertOne({
      _id: null,
      userId,
      type,
      duration,
    });

    await service.delete(userId, createdSeizure.insertedId);

    const deletedSeizure = await collection.findOne({
      _id: createdSeizure.insertedId,
    });
    expect(deletedSeizure).toBeNull();
  });

  it('get - when no userId given, should return empty', async () => {
    const userId = new ObjectId();

    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.TONIC,
      duration: 0,
    });

    const seizures = await service.get(null, null, null);

    expect(seizures).toHaveLength(0);
  });

  it('get - when no duration is given, should return all user seizures', async () => {
    const userId = new ObjectId();

    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.TONIC,
      duration: 0,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.TONIC,
      duration: 5,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.ATONIC,
      duration: 10,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.ATONIC,
      duration: 15,
    });

    const seizures = await service.get(userId, null, null);

    expect(seizures).toHaveLength(4);
    expect(seizures[0].type).toEqual(SeizureType.TONIC);
    expect(seizures[1].type).toEqual(SeizureType.TONIC);
    expect(seizures[2].type).toEqual(SeizureType.ATONIC);
    expect(seizures[3].type).toEqual(SeizureType.ATONIC);
  });

  it('get - when only durationFrom and userId is given, should return seizures after given durationFrom', async () => {
    const userId = new ObjectId();
    const durationFrom = 5;

    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.TONIC,
      duration: 0,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.TONIC,
      duration: 5,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.ATONIC,
      duration: 10,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.ATONIC,
      duration: 15,
    });

    const seizures = await service.get(userId, durationFrom, null);

    expect(seizures).toHaveLength(3);
    expect(seizures[0].type).toEqual(SeizureType.TONIC);
    expect(seizures[1].type).toEqual(SeizureType.ATONIC);
    expect(seizures[2].type).toEqual(SeizureType.ATONIC);
  });

  it('get - when only durationTill and userId is given, should return seizures before given durationTill', async () => {
    const userId = new ObjectId();
    const durationTill = 10;

    // Insert test data
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.TONIC,
      duration: 0,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.TONIC,
      duration: 5,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.ATONIC,
      duration: 10,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.ATONIC,
      duration: 15,
    });

    const seizures = await service.get(userId, null, durationTill);

    expect(seizures).toHaveLength(3);
    expect(seizures[0].type).toEqual(SeizureType.TONIC);
    expect(seizures[1].type).toEqual(SeizureType.TONIC);
    expect(seizures[2].type).toEqual(SeizureType.ATONIC);
  });

  it('get - when all filters are given, should return seizures between durationFrom and durationTill', async () => {
    const userId = new ObjectId();
    const durationFrom = 5;
    const durationTill = 10;

    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.TONIC,
      duration: 0,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.TONIC,
      duration: 5,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.ATONIC,
      duration: 10,
    });
    await collection.insertOne({
      _id: null,
      userId,
      type: SeizureType.ATONIC,
      duration: 15,
    });

    const seizures = await service.get(userId, durationFrom, durationTill);

    expect(seizures).toHaveLength(2);
    expect(seizures[0].type).toEqual(SeizureType.TONIC);
    expect(seizures[1].type).toEqual(SeizureType.ATONIC);
  });

  it('get - When other users have seizures, should not return seizures', async () => {
    const userId = new ObjectId();
    const otherUserId = new ObjectId();

    await collection.insertOne({
      _id: null,
      userId: otherUserId,
      type: SeizureType.TONIC,
      duration: 0,
    });

    const seizures = await service.get(userId, null, null);

    expect(seizures).toHaveLength(0);
  });

  it('stream - when no filter is given, should return  CREATE event for any new seizure', async () => {
    const userId = new ObjectId();
    const type = SeizureType.TONIC;
    const duration = 0;

    const stream = service.stream(userId, null, null);
    const emittedEvents: SeizureChange[] = [];

    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await collection.insertOne({
      _id: null,
      userId,
      type: type,
      duration: duration,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(1);
    expect(emittedEvents[0].change).toEqual(0); // ChangeType.CREATE
    expect(emittedEvents[0].seizure.userId).toEqual(userId);
    expect(emittedEvents[0].seizure.type).toEqual(type);
    expect(emittedEvents[0].seizure.duration).toEqual(duration);

    stream.complete();
  });

  it('stream - when filter is given, should only return CREATE event new seizures within filters', async () => {
    const userId = new ObjectId();
    const type = SeizureType.TONIC;
    const durationFrom = 5;
    const durationTill = 10;

    const stream = service.stream(userId, durationFrom, durationTill);
    const emittedEvents: SeizureChange[] = [];

    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await collection.insertOne({
      _id: null,
      userId,
      type: type,
      duration: 0,
    });

    await collection.insertOne({
      _id: null,
      userId,
      type: type,
      duration: 5,
    });

    await collection.insertOne({
      _id: null,
      userId,
      type: type,
      duration: 10,
    });

    await collection.insertOne({
      _id: null,
      userId,
      type: type,
      duration: 15,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(2);
    expect(emittedEvents[0].change).toEqual(0); // ChangeType.CREATE
    expect(emittedEvents[0].seizure.duration).toEqual(5);
    expect(emittedEvents[1].change).toEqual(0); // ChangeType.CREATE
    expect(emittedEvents[1].seizure.duration).toEqual(10);

    stream.complete();
  });

  it('stream - when no filter is given, should return DELETE event for any deleted seizure', async () => {    const userId = new ObjectId();
    const type = SeizureType.TONIC;
    const duration = 1;

    const stream = service.stream(userId, null, null);
    const emittedEvents: SeizureChange[] = [];

    const result = await collection.insertOne({
      _id: null,
      userId,
      type: type,
      duration: duration,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await service.delete(userId, result.insertedId)

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(1);
    expect(emittedEvents[0].change).toEqual(2); // ChangeType.DELETE
    expect(emittedEvents[0].seizure._id).toEqual(result.insertedId);

    stream.complete();
  });

  it('stream - When other user changes data, should not return event', async () => {
    const userId = new ObjectId();
    const otherUserId = new ObjectId();
    const type = SeizureType.TONIC;
    const duration = 1;

    const stream = service.stream(userId, null, null);
    const emittedEvents: SeizureChange[] = [];

    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    const result = await collection.insertOne({
      _id: null,
      userId: otherUserId,
      type: type,
      duration: duration,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(0);

    stream.complete();
  });
});
