import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';

@Injectable()
export class JwtHandlerService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}


  generateAccessToken(userId: ObjectId): string {
    return this.jwtService.sign({
      userId: userId.toHexString(),
    });
  }

  //check access token is valid and within expiration
  validateAccessToken(token: string): boolean {
    try {
        this.jwtService.verify(token);
        return true;
      } catch (error) {
        return false;
      }
  }
  //get userId from access token
  decodeAccessToken(token: string): ObjectId {
    const decodedToken = this.jwtService.decode(token);
    const userIdHex = decodedToken['userId'];
    return new ObjectId(userIdHex);
  }
}
