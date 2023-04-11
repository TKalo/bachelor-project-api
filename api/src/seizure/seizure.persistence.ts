import { Injectable } from '@nestjs/common';
import { Collection, ObjectId } from 'mongodb';
import { MongoService } from '../common/services/mongo.service';
import { Seizure, SeizureType } from './types/Seizure.entity';
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

  async delete(seizureId: ObjectId): Promise<void> {
    await this.seizureCollection.updateOne(
      { _id: seizureId },
      { $set: {deleted: true} },
    );
    await this.seizureCollection.deleteOne({ _id: seizureId });
  }

  async get(
    userId: ObjectId,
    durationFrom: number,
    durationTill: number,
  ): Promise<Seizure[]> {
    try {
      const query: any = {};

      query.userId = userId;

      if (durationFrom !== null) {
        query.duration = { ...(query.duration || {}), $gte: durationFrom };
      }

      if (durationTill !== null) {
        query.duration = { ...(query.duration || {}), $lte: durationTill };
      }

      return await this.seizureCollection.find(query).toArray();
    } catch (e) {
      return null;
    }
  }

  async stream(
    userId: ObjectId,
    durationFrom: number,
    durationTill: number,
  ): Promise<Subject<SeizureChange>> {
    const stream = new Subject<SeizureChange>();

    let query: any = {
      $or: [
        { 'fullDocument.userId': userId },
        { 'fullDocumentBeforeChange.userId': userId },
      ],
    };

    if (durationFrom !== null && durationTill == null) {
      query = {
        ...query,
        'fullDocument.duration': {
          $gte: durationFrom,
        },
      };
    }

    if (durationTill !== null && durationFrom == null) {
      query = {
        ...query,
        'fullDocument.duration': {
          $lte: durationTill,
        },
      };
    }

    if (durationTill !== null && durationFrom !== null) {
      query = {
        ...query,
        'fullDocument.duration': {
          $gte: durationFrom,
          $lte: durationTill,
        },
      };
    }

    const dbStream = this.seizureCollection.watch([{ $match: query }], {
      fullDocument: 'updateLookup',
      fullDocumentBeforeChange: 'whenAvailable',
    });

    dbStream.on('change', (event: any) => {
      switch (event.operationType) {
        case 'delete':
          stream.next({
            change: ChangeType.DELETE,
            seizure: event.fullDocument,
          });
          break;
        case 'update':
          if (event.fullDocument.deleted) {
            stream.next({
              change: ChangeType.DELETE,
              seizure: event.fullDocument,
            });
          } else {
            stream.next({
              change: ChangeType.UPDATE,
              seizure: event.fullDocument,
            });
          }
          break;
        case 'insert':
          stream.next({
            change: ChangeType.CREATE,
            seizure: event.fullDocument,
          });
          break;
        default:
          stream.next({
            change: ChangeType.DELETE,
            seizure: event.fullDocument,
          });
          return;
      }
    });

    stream.subscribe({
      complete: () => {
        dbStream.close();
      },
    });

    return stream;
  }
}
