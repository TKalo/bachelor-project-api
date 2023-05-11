import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Observable, Subject, filter, from, map } from 'rxjs';
import { JwtHandlerService } from '../common/services/jwt.service';
import { SeizureDataInsufficientError } from './errors/seizure-data-insufficient.error';
import { SeizurePersistenceService } from './seizure.persistence';
import { Seizure, SeizureType } from './types/seizure.entity';
import { SeizureChange } from './types/seizure-change.entity';
import { SeizureDoesNotExistError } from './errors/seizure-does-not-exist.error';
import { error } from 'console';

@Injectable()
export class SeizureService {
  private readonly globalStream: Subject<SeizureChange>;
  constructor(
    private readonly persistence: SeizurePersistenceService,
    private readonly jwtService: JwtHandlerService,
  ) {
    this.globalStream = persistence.globalStream();
  }

  validation(duration: number, typeValue: number) {
    if (SeizureType[typeValue] == undefined) {
      throw new SeizureDataInsufficientError();
    }

    if (duration < 0) {
      throw new SeizureDataInsufficientError();
    }
  }

  async create(
    accessToken: string,
    typeValue: number,
    durationSeconds: number,
  ): Promise<void> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    const type: SeizureType = SeizureType[SeizureType[typeValue]];

    await this.persistence.create(userId, type, durationSeconds);
  }

  async delete(accessToken: string, seizureId: string): Promise<void> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    try {
      const seizureObjectId = new ObjectId(seizureId);

      await this.persistence.delete(userId, seizureObjectId);
    } catch (e) {
      throw new SeizureDoesNotExistError();
    }
  }

  get(
    accessToken: string,
    durationFrom: number,
    durationTill: number,
  ): Promise<Seizure[]> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    return this.persistence.get(userId, durationFrom, durationTill);
  }

  stream(
    accessToken: string,
    durationFrom: number,
    durationTill: number,
  ): Subject<SeizureChange> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    const stream = new Subject<SeizureChange>();

    const subscription = this.globalStream.subscribe({
      next: (change) => {
        const idMatch =
          userId.toHexString() == change.seizure.userId.toHexString();
        const fromMatch =
          durationFrom == null ||
          change.seizure.duration > durationFrom ||
          change.seizure.duration == durationFrom;
        const tillMatch =
          durationTill == null ||
          change.seizure.duration < durationTill ||
          change.seizure.duration == durationTill;
        if (idMatch && fromMatch && tillMatch) {
          stream.next(change);
        }
      },
    });

    stream.subscribe({
      complete: () => subscription.unsubscribe(),
      error: () => subscription.unsubscribe(),
    });

    return stream;
  }
}
