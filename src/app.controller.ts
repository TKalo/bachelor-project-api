import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { Controller, Logger } from '@nestjs/common';
import { Hero, HeroById, HeroServiceController, HeroServiceControllerMethods } from 'generated_proto/hero';
import { Observable } from 'rxjs';

@Controller()
@HeroServiceControllerMethods()
export class AppController implements HeroServiceController {
  findOne(request: HeroById): Hero | Promise<Hero> | Observable<Hero> {
    const items = [
      { id: 0, name: 'John'},
      { id: 1, name: 'Jahn'},
    ];

    let hero : Hero;


    for(let x = 0; x < items.length ; x++){
      Logger.debug("expected: " + request.id)
      Logger.debug("actual: " + items[x].id)


      if(items[x].id === request.id){
        hero = {
          id: x,
          name: items[x].name
        }
        break
      }
    }

    return hero
  }
}