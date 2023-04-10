

import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { JwtHandlerService } from '../common/services/jwt.service';
import { SeizurePersistenceService } from './seizure.persistence';
import { Seizure } from './types/Seizure.entity';
import { SeizureChange } from './types/seizure-change.entity';


@Injectable()
export class SeizureService {
  constructor(
    private readonly persistence: SeizurePersistenceService,
    private readonly jwtService: JwtHandlerService,
  ) {}

  async createProfile(accessToken: string, name: string): Promise<void> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

  }

  async updateProfile(accessToken: string, name: string): Promise<void> {
    const userId = this.jwtService.decodeAccessToken(accessToken);


  }

  getProfile(accessToken: string): Promise<Seizure> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    return null;
  }

  streamProfile(accessToken: string): Subject<SeizureChange> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    return null;
  }
}
