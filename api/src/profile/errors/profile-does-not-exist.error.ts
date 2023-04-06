
export class ProfileDoesNotExistError extends Error {
    constructor() {
      super('profile-does-not-exist');
    }
  }
  