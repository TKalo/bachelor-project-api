import { ObjectId } from 'mongodb';

export class Profile {
  _id: ObjectId;
  name!: string;
}
