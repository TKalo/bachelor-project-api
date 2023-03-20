import { Injectable } from '@nestjs/common';
import { ChangeStream, Collection, MongoClient, ReadPreference } from 'mongodb';

@Injectable()
export class PersistenceService {
  private client: MongoClient;
  private collection: Collection;
  private collectionName = 'myCollection';
  private dbName = 'myDatabase';  
  private changeStream: ChangeStream;

  async connect(){
      // MongoDB connection URL
      const url = 'mongodb://mongo:27017';
      // Create a MongoDB client
      this.client = new MongoClient(url, {
        readConcernLevel: 'majority',
        replicaSet:  'rs0',
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        waitQueueTimeoutMS: 10000,
        readPreference: 'primary',
        ssl: false,
        
      });

      // Connect to the MongoDB database and return a collection

      await this.client.connect();
      const db = this.client.db(this.dbName);
      this.collection = db.collection(this.collectionName);

  }

  async injectConnection(client: MongoClient){
    this.client = client;
    const db = this.client.db(this.dbName);
    this.collection = db.collection(this.collectionName);
  }

  async addMessage(message: string): Promise<void> {
    try {
      // Create a document with the message and the current date and time
      const doc = {
        message,
        createdAt: new Date(),
      };

      // Insert the document into the collection
      await this.collection.insertOne(doc);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  watchCollection(): ChangeStream {
    try {
        this.changeStream = this.collection.watch([],{
          fullDocument: "updateLookup"
        });
      // Return the change stream
      return this.changeStream
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Close the MongoDB client
      await this.changeStream.close();
      await this.client.close();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}