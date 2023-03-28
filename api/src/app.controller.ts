import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import { Controller } from '@nestjs/common';
import {
  Hero,
  HeroById,
  HeroServiceController,
  HeroServiceControllerMethods,
  Message,
  Ping,
  Void,
} from 'generated_proto/hero';
import { ChangeStreamDocument } from 'mongodb';
import { Observable, Subject } from 'rxjs';
import { PersistenceService } from './app.persistence';

@Controller()
@HeroServiceControllerMethods()
export class AppController implements HeroServiceController {
  returnToken(
    request: Void,
    metadata?: Metadata,
  ): Message | Observable<Message> | Promise<Message> {
    const token = metadata
      .get('authentication')
      ?.toString()
      ?.replace(/^Bearer\s/, '');
    return { id: 0, message: token || 'No token found in metadata' };
  }

  addMessage(request: Message): Void | Promise<Void> | Observable<Void> {
    const service = new PersistenceService();

    service.connect().then(() => {
      service.addMessage(request.message);
    });

    return {};
  }

  messageStream(request: Void): Observable<Message> {
    const subject = new Subject<Message>();

    const service = new PersistenceService();

    service.connect().then(() => {
      const changeStream = service.watchCollection();

      let x = 0;
      changeStream.on('change', (event: ChangeStreamDocument<Document>) => {
        subject.next({ id: x, message: event.operationType });
        x++;
      });
    });

    return subject;
  }

  pingStream(request: Void): Observable<Ping> {
    const subject = new Subject<Ping>();

    this.infinitePing(subject);

    return subject.asObservable();
  }

  async infinitePing(subject: Subject<Ping>) {
    let x = 0;
    while (!subject.isStopped) {
      await new Promise((resolve) => setTimeout(resolve, 100));
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
