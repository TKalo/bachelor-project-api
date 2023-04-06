import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { JwtHandlerService } from '../common/services/jwt.service';
import { ProfilePersistenceService } from './profile.persistence';
import { ProfileChange } from './types/profile-change.entity';
import { Profile } from './types/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    private readonly persistence: ProfilePersistenceService,
    private readonly jwtService: JwtHandlerService,
  ) {}

  async createProfile(accessToken: string, name: string): Promise<void> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    await this.persistence.createProfile(userId, name);
  }

  async updateProfile(accessToken: string, name: string): Promise<void> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    await this.persistence.updateProfile(userId, name);
  }

  getProfile(accessToken: string): Promise<Profile> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    return this.persistence.getProfile(userId);
  }

  streamProfile(accessToken: string): Subject<ProfileChange> {
    const userId = this.jwtService.decodeAccessToken(accessToken);

    return this.persistence.streamProfile(userId);
  }
}
