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

export const HERO_PACKAGE_NAME = "hero";

export interface HeroServiceClient {
  findOne(request: HeroById): Observable<Hero>;

  pingStream(request: Observable<Ping>): Observable<Ping>;
}

export interface HeroServiceController {
  findOne(request: HeroById): Promise<Hero> | Observable<Hero> | Hero;

  pingStream(request: Observable<Ping>): Observable<Ping>;
}

export function HeroServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["findOne"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("HeroService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = ["pingStream"];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("HeroService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const HERO_SERVICE_NAME = "HeroService";
