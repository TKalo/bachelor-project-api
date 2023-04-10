import { Injectable } from '@nestjs/common';
import { Collection } from 'mongodb';
import { MongoService } from '../common/services/mongo.service';
import { Seizure } from './types/Seizure.entity';

@Injectable()
export class SeizurePersistenceService {
  private readonly seizureCollection: Collection<Seizure>;
  constructor(
    private readonly mongoService: MongoService, //
  ) {
    this.seizureCollection = mongoService.getCollection<Seizure>(Seizure.name);
  }

}
