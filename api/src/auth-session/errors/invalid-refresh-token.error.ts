
export class InvalidRefreshTokenError extends Error {
    constructor() {
      super('invalid-refresh-token');
    }
  }
  