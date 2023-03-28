import { Injectable, OnModuleInit } from '@nestjs/common';
import { Collection } from 'mongodb';
import { MongoService } from '../common/mongo.service';
import { EmailTakenError } from './errors/email-taken.error';
import { AuthUser } from './types/auth-user.entity';

@Injectable()
export class AuthPersistenceService implements OnModuleInit {
  private readonly authUserCollection: Collection<AuthUser>
  constructor(
    private readonly mongoService: MongoService, //
  ) {
    this.authUserCollection = mongoService.getCollection<AuthUser>(AuthUser.name);
  }

  async onModuleInit() {
    await this.authUserCollection.createIndex(
      { email: 1 },
      { unique: true },
    );
  }

  async createUser(
    email: string,
    password: string,
    salt: string,
  ): Promise<AuthUser> {

    const existingUser = await this.authUserCollection.findOne({email: email});

    if(existingUser) throw new EmailTakenError();

    let user = {
      _id: null,
      email: email,
      password: password,
      salt: salt
    };

    const result = await this.authUserCollection.insertOne(user);

    user._id = result.insertedId;

    return user;
  }

  async getUserFromEmail( email: string): Promise<AuthUser>  {
    return await this.authUserCollection.findOne({
      email: email
    });
  }
}
