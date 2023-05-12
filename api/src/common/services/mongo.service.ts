import { Injectable, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Collection, Db, MongoClient } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleDestroy {
  onModuleDestroy() {
    this.client.close();
  }
  private client: MongoClient;
  private db: Db;

  constructor(private readonly config: ConfigService) {
    // MongoDB connection URL
    const url = this.config.getOrThrow('DATABASE_URI');

    Logger.log('MONGO_URL:' + url);

    // Create a MongoDB client
    this.client = new MongoClient(url, {
      readConcernLevel: 'majority',
      maxPoolSize: 500,
      maxIdleTimeMS: 3000,
    });

    const dbName = this.config.getOrThrow('DATABASE_NAME');

    this.db = this.client.db(dbName);
  }

  getCollection<T>(name: string): Collection<T> {
    return this.db.collection<T>(name);
  }
}

@Module({
  imports: [ConfigModule],
  providers: [MongoService],
  exports: [MongoService],
})
export class MongoModule {}
