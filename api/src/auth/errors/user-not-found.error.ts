
export class UserNotFoundError extends Error {
  constructor() {
    super('user-not-found');
  }
}
