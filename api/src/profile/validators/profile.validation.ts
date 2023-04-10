import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ProfileDataInsufficientError } from '../errors/profile-data-insufficient.error';
import { Profile } from 'generated_proto/hero';

@Injectable()
export class ProfileValidationService {
  constructor() {}

  nameValidation(profile: Profile) {
    if (profile.name.length < 3) {
      throw new ProfileDataInsufficientError();
    }
  }
}
