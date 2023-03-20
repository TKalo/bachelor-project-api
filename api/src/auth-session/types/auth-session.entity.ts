import { ObjectId } from 'mongodb';

export class AuthSession {
  refreshToken!: string;
  userId!: ObjectId;
  expiresAt!: Date;
}
