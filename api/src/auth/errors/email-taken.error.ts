
export class EmailTakenError extends Error {
    constructor() {
      super('email-taken');
    }
  }
  