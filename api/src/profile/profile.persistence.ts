import { Injectable, OnModuleInit } from '@nestjs/common';
import { Collection, ObjectId } from 'mongodb';
import { Subject } from 'rxjs/internal/Subject';
import { MongoService } from '../common/services/mongo.service';
import { ChangeType, ProfileChange } from './types/profile-change.entity';
import { Profile } from './types/profile.entity';

@Injectable()
export class ProfilePersistenceService implements OnModuleInit {
  private readonly profileCollection: Collection<Profile>;
  constructor(
    private readonly mongoService: MongoService, //
  ) {
    this.profileCollection = mongoService.getCollection<Profile>(Profile.name);
  }

  async onModuleInit() {
    await this.profileCollection.createIndex({ email: 1 }, { unique: true });
  }

  async createProfile(userId: ObjectId, name: string): Promise<void> {
    const profile: Profile = {
      _id: userId,
      name: name,
    };

    await this.profileCollection.insertOne(profile);
  }

  async updateProfile(userId: ObjectId, name: string): Promise<void> {
    await this.profileCollection.updateOne({ _id: userId }, { $set: { name } });
  }

  async getProfile(userId: ObjectId): Promise<Profile> {
    try {
      return await this.profileCollection.findOne({
        _id: userId,
      });
    } catch (e) {
      return null;
    }
  }

  streamProfile(userId: ObjectId): Subject<ProfileChange> {
    const stream = new Subject<ProfileChange>();

    const dbStream = this.profileCollection.watch([], {
      fullDocument: 'updateLookup',
    });

    dbStream.on('change', (event: any) => {
      let change: ProfileChange;
      switch (event.operationType) {
        case 'delete':
          change = { change: ChangeType.DELETE, profile: event.fullDocument };
          break;
        case 'update':
          change = { change: ChangeType.UPDATE, profile: event.fullDocument };
          break;
        case 'insert':
          change = { change: ChangeType.CREATE, profile: event.fullDocument };
          break;
        default:
          return;
      }

      stream.next(change);
    });

    stream.subscribe({
      complete: () => {
        dbStream.close();
      },
    });

    return stream;
  }
}
