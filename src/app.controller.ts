import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Hero, HeroById } from 'generated_proto/hero_pb';

@Controller()
export class AppController {
  @GrpcMethod('HeroService', 'FindOne')
  FindOne(data: HeroById.AsObject, metadata: Metadata, call: ServerUnaryCall<any,any>): Hero {
    const items = [
      { id: 0, name: 'John'},
      { id: 1, name: 'Jahn'},
    ];

    const hero = new Hero()
    let object;


    for(let x = 0; x < items.length ; x++){
      Logger.debug("expected: " + data.id)
      Logger.debug("actual: " + items[x].id)


      if(items[x].id === data.id){
        object = {
          id: x, name: items[x].name
        }
        hero.setId(x)
        hero.setName(items[x].name)
        break
      }
    }


    Logger.debug("return: " + object)

    return object
  }
}