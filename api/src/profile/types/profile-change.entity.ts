import { Profile } from './profile.entity';

export enum ChangeType {
  CREATE,
  UPDATE,
  DELETE,
}

export class ProfileChange {
  change: ChangeType;
  profile: Profile;
}
