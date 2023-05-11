import { Collection, ObjectId } from 'mongodb';
import { MongoService } from '../../common/services/mongo.service';
import { TestContext, init } from '../../common/test-environment';
import { JwtHandlerService } from '../../common/services/jwt.service';
import { SeizureDataInsufficientError } from '../errors/seizure-data-insufficient.error';
import { SeizureService } from '../seizure.service';
import { Seizure, SeizureType } from '../types/seizure.entity';
import { SeizureChange } from '../types/seizure-change.entity';

describe('SeizureService', () => {
  let service: SeizureService;
  let jwtService: JwtHandlerService;
  let context: TestContext;
  let collection: Collection<Seizure>;

  beforeAll(async () => {
    context = await init();
    service = context.t.get<SeizureService>(SeizureService);
    jwtService = context.t.get<JwtHandlerService>(JwtHandlerService);

    const mongoService = context.t.get<MongoService>(MongoService);
    collection = mongoService.getCollection(Seizure.name);
  });

  
  afterAll(async () => await context.mongoServer.stop());

  afterEach(async () => await collection.deleteMany({}));

  it('validation - when given negative duration, should throw error', () => {
    const duration = -10;
    const typeValue = 0;
  
    expect(() => service.validation(duration, typeValue)).toThrowError(SeizureDataInsufficientError);
  });
  
  it('validation - when given invalid enum, should throw error', () => {
    const duration = 10;
    const typeValue = 999; // an invalid enum value
  
    expect(() => service.validation(duration, typeValue)).toThrowError(SeizureDataInsufficientError);
  });
  
  it('validation - when given valid input, should not throw error', () => {
    const duration = 10;
    const typeValue = 0;
  
    expect(() => service.validation(duration, typeValue)).not.toThrowError();
  });

  it('create - when valid input is given, should create seizure', async () => {
    const userId = new ObjectId();
    const accessToken = jwtService.generateAccessToken(userId);
    const type = 0;
    const durationSeconds = 10;

    await service.create(accessToken, type, durationSeconds);

    const createdSeizure = await collection.findOne({ userId });
    expect(createdSeizure).toBeDefined();
    expect(createdSeizure.userId).toEqual(userId);
    expect(createdSeizure.type).toEqual(type);
    expect(createdSeizure.duration).toEqual(durationSeconds);
  });

  it('delete - when valid input is given, should delete seizure', async () => {
    const userId = new ObjectId();
    const accessToken = jwtService.generateAccessToken(userId);
    const type = 0;
    const duration = 10;

    const createdSeizure = await collection.insertOne({
      _id: null,
      userId,
      type,
      duration,
    });
    const seizureId = createdSeizure.insertedId;

    await service.delete(accessToken, seizureId.toHexString());

    const deletedSeizure = await collection.findOne({ _id: seizureId });
    expect(deletedSeizure).toBeNull();
  });
  it('get - when valid input is given, should get seizures', async () => {
    const userId = new ObjectId();
    const accessToken = jwtService.generateAccessToken(userId);
    const type = 0;
    const duration = 10;

    await collection.insertOne({ _id: null, userId, type, duration });

    const seizures = await service.get(accessToken, 0, 100);

    expect(seizures.length).toBe(1);
    expect(seizures[0].userId).toEqual(userId);
    expect(seizures[0].type).toEqual(type);
    expect(seizures[0].duration).toEqual(duration);
  });

  it('stream - when no filter is given, should return  CREATE event for any new seizure', async () => {
    const userId = new ObjectId();
    const accessToken = jwtService.generateAccessToken(userId);
    const type = SeizureType.TONIC;
    const duration = 0;

    const stream = service.stream(accessToken, null, null);
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

  it('stream - when no filter is given, should return  DELETE event for any deleted seizure', async () => {
    const userId = new ObjectId();
    const seizureId = new ObjectId();
    const accessToken = jwtService.generateAccessToken(userId);
    const type = SeizureType.TONIC;
    const duration = 0;

    await collection.insertOne({
      _id: seizureId,
      userId,
      type: type,
      duration: duration,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const stream = service.stream(accessToken, null, null);
    const emittedEvents: SeizureChange[] = [];
    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await service.delete(accessToken, seizureId.toHexString())

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(1);
    expect(emittedEvents[0].change).toEqual(2); // ChangeType.DELETE
    expect(emittedEvents[0].seizure.userId).toEqual(userId);
    expect(emittedEvents[0].seizure.type).toEqual(type);
    expect(emittedEvents[0].seizure.duration).toEqual(duration);

    stream.complete();
  });

  it('stream - when filter is given, should only return CREATE event for new seizures within filters', async () => {
    const userId = new ObjectId();
    const accessToken = jwtService.generateAccessToken(userId);
    const type = SeizureType.TONIC;
    const durationFrom = 5;
    const durationTill = 10;

    const stream = service.stream(accessToken, durationFrom, durationTill);
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

  it('stream - when filter is given, should only return DELETE event for new seizures within filters', async () => {
    const userId = new ObjectId();
    const seizureId1 = new ObjectId();
    const seizureId2 = new ObjectId();
    const seizureId3 = new ObjectId();
    const seizureId4 = new ObjectId();
    const accessToken = jwtService.generateAccessToken(userId);
    const type = SeizureType.TONIC;
    const durationFrom = 5;
    const durationTill = 10;

    await collection.insertOne({
      _id: seizureId1,
      userId,
      type: type,
      duration: 0,
    });

    await collection.insertOne({
      _id: seizureId2,
      userId,
      type: type,
      duration: 5,
    });

    await collection.insertOne({
      _id: seizureId3,
      userId,
      type: type,
      duration: 10,
    });

    await collection.insertOne({
      _id: seizureId4,
      userId,
      type: type,
      duration: 15,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const stream = service.stream(accessToken, durationFrom, durationTill);
    const emittedEvents: SeizureChange[] = [];
    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await service.delete(accessToken, seizureId1.toHexString())
    await service.delete(accessToken, seizureId2.toHexString())
    await service.delete(accessToken, seizureId3.toHexString())
    await service.delete(accessToken, seizureId4.toHexString())

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emittedEvents.length).toEqual(2);
    expect(emittedEvents[0].change).toEqual(2); // ChangeType.DELETE
    expect(emittedEvents[0].seizure.duration).toEqual(5);
    expect(emittedEvents[1].change).toEqual(2); // ChangeType.DELETE
    expect(emittedEvents[1].seizure.duration).toEqual(10);

    stream.complete();
  });

  it('stream - When other user changes data, should not return event', async () => {
    const userId = new ObjectId();
    const otherUserId = new ObjectId();
    const accessToken = jwtService.generateAccessToken(userId);
    const type = SeizureType.TONIC;
    const duration = 0;

    const stream = service.stream(accessToken, null, null);
    const emittedEvents: SeizureChange[] = [];
    stream.subscribe((event) => emittedEvents.push(event));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await collection.insertOne({
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

