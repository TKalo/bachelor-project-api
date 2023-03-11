import { Controller, Logger } from '@nestjs/common';
import {
  Hero,
  HeroById,
  HeroServiceController,
  HeroServiceControllerMethods,
  Ping,
} from 'generated_proto/hero';
import { Observable, Subject } from 'rxjs';

@Controller()
@HeroServiceControllerMethods()
export class AppController implements HeroServiceController {
  pingStream(request: Observable<Ping>): Observable<Ping> {
    const subject = new Subject<Ping>();

    Logger.debug('PING STREAM STARTED');

    request.subscribe({
      complete: () => {
        subject.complete();
        Logger.debug('PING STREAM ENDED');
      },
    });

    this.infinitePing(subject);

    return subject.asObservable();
  }

  async infinitePing(subject: Subject<Ping>) {
    let x = 0;
    while (!subject.isStopped) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      x++;
      subject.next({ id: x });
    }
  }

  findOne(request: HeroById): Hero | Promise<Hero> | Observable<Hero> {
    const items = [
      { id: 0, name: 'John' },
      { id: 1, name: 'Jahn' },
    ];

    let hero: Hero;

    for (let x = 0; x < items.length; x++) {
      if (items[x].id === request.id) {
        hero = {
          id: x,
          name: items[x].name,
        };
        break;
      }
    }

    return hero;
  }
}
