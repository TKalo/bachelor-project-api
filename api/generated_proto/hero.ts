/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "hero";

export interface Ping {
  id: number;
}

export interface HeroById {
  id: number;
}

export interface Hero {
  id: number;
  name: string;
}

export interface Message {
  id: number;
  message: string;
}

export interface Void {
}

export const HERO_PACKAGE_NAME = "hero";

export interface HeroServiceClient {
  findOne(request: HeroById): Observable<Hero>;

  pingStream(request: Void): Observable<Ping>;

  addMessage(request: Message): Observable<Void>;

  messageStream(request: Void): Observable<Message>;
}

export interface HeroServiceController {
  findOne(request: HeroById): Promise<Hero> | Observable<Hero> | Hero;

  pingStream(request: Void): Observable<Ping>;

  addMessage(request: Message): Promise<Void> | Observable<Void> | Void;

  messageStream(request: Void): Observable<Message>;
}

export function HeroServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["findOne", "pingStream", "addMessage", "messageStream"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("HeroService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("HeroService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const HERO_SERVICE_NAME = "HeroService";
