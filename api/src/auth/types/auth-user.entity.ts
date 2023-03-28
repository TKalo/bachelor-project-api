import { ObjectId } from 'mongodb';

export class AuthUser {
  _id: ObjectId;
  email!: string;
  password!: string;
  salt!: string;
}
