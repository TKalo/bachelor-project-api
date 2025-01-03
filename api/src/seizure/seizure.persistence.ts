import { Injectable } from '@nestjs/common';
import { Collection, ObjectId } from 'mongodb';
import { MongoService } from '../common/services/mongo.service';
import { Seizure, SeizureType } from './types/seizure.entity';
import { ChangeType, SeizureChange } from './types/seizure-change.entity';
import { Subject } from 'rxjs/internal/Subject';

@Injectable()
export class SeizurePersistenceService {
  private readonly seizureCollection: Collection<Seizure>;
  constructor(
    private readonly mongoService: MongoService, //
  ) {
    this.seizureCollection = mongoService.getCollection<Seizure>(Seizure.name);
  }

  async create(
    userId: ObjectId,
    type: SeizureType,
    duration: number,
  ): Promise<void> {
    if (type == null || userId == null) throw Error('insufficient data');

    const seizure: Seizure = {
      _id: null,
      userId: userId,
      type: type,
      duration: duration,
      deleted: false,
    };

    await this.seizureCollection.insertOne(seizure);
  }

  async delete(userId: ObjectId, seizureId: ObjectId): Promise<void> {
    await this.seizureCollection.updateOne(
      { _id: seizureId, userId: userId },
      { $set: { deleted: true } },
    );
    await this.seizureCollection.deleteOne({ _id: seizureId, userId: userId });
  }

  async get(
    userId: ObjectId,
    durationFrom: number,
    durationTill: number,
  ): Promise<Seizure[]> {
    try {
      const query: any = {};

      query.userId = userId;

      if (durationFrom != undefined) {
        query.duration = { ...(query.duration || {}), $gte: durationFrom };
      }

      if (durationTill != undefined) {
        query.duration = { ...(query.duration || {}), $lte: durationTill };
      }

      return await this.seizureCollection.find(query).toArray();
    } catch (e) {
      return null;
    }
  }

  globalStream(){
    const stream = new Subject<SeizureChange>();

    const dbStream = this.seizureCollection.watch([], {
      fullDocument: 'updateLookup',
    });

    dbStream.on('change', (event: any) => {
      switch (event.operationType) {
        case 'update':
          stream.next({
            change: event.fullDocument == null ||  event.fullDocument.deleted
              ? ChangeType.DELETE
              : ChangeType.UPDATE,
            seizure: event.fullDocument,
          });
          break;
        case 'insert':
          stream.next({
            change: ChangeType.CREATE,
            seizure: event.fullDocument,
          });
          break;
        default:
          return;
      }
    });

    stream.subscribe({
      complete: () => dbStream.close(),
      error: () => dbStream.close(),
    });

    return stream;
  }

}