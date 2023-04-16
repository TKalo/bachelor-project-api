import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { JwtHandlerService } from '../common/services/jwt.service';
import { ProfilePersistenceService } from './profile.persistence';
import { ProfileChange } from './types/profile-change.entity';
import { Profile } from './types/profile.entity';
import { ProfileDataInsufficientError } from './errors/profile-data-insufficient.error';

@Injectable()
export class ProfileService {
  constructor(
    private readonly persistence: ProfilePersistenceService,
    private readonly jwtService: JwtHandlerService,
  ) {}

  validation(name: String ) {
    if (name.length < 3) {
      throw new ProfileDataInsufficientError();
    }
  }

  async create(accessToken: string, name: string): Promise<void> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    await this.persistence.create(userId, name);
  }

  async update(accessToken: string, name: string): Promise<void> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    await this.persistence.update(userId, name);
  }

  get(accessToken: string): Promise<Profile> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    return this.persistence.get(userId);
  }

  stream(accessToken: string): Subject<ProfileChange> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    return this.persistence.stream(userId);
  }
}
