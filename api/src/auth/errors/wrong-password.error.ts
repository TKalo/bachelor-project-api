
export class WrongPasswordError extends Error {
  constructor() {
    super('wrong-password');
  }
}
