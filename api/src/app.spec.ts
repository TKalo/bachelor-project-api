import { Test, TestingModule } from '@nestjs/testing';
import { MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { PersistenceService } from './app.persistence';

describe('PersistenceService', () => {
  let mongoClient: MongoClient;
  let mongoServer: MongoMemoryReplSet;

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  describe('addMessage', () => {
    it('should insert a message into the collection', async () => {
      // Create a new MongoDB client and connect to the in-memory MongoDB server
      mongoServer = await MongoMemoryReplSet.create({
        replSet: { storageEngine: 'wiredTiger' },
      });
      const mongoUri = mongoServer.getUri();
      mongoClient = await MongoClient.connect(mongoUri, {});

      // Create a new testing module
      const module: TestingModule = await Test.createTestingModule({
        providers: [PersistenceService],
      }).compile();

      const service = module.get<PersistenceService>(PersistenceService);

      service.injectConnection(mongoClient);

      const changeEvents: any[] = [];
      const changeStream = service.watchCollection();
      changeStream.on('change', (event: any) => {
        changeEvents.push(event);
      });

      // Call the addMessage function with a test message
      await service.addMessage('Hello, world!');

      // Wait for the change stream to emit a change event
      await new Promise((resolve) => setTimeout(resolve, 1000));

      changeStream.close();
      // Verify that the change stream was updated with the new message
      expect(changeEvents).toHaveLength(1);
      expect(changeEvents[0].operationType).toEqual('insert');
      expect(changeEvents[0].fullDocument.message).toEqual('Hello, world!');
    }, 10000);
  });
});
