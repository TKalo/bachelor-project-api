import { Controller, UseGuards } from '@nestjs/common';
import {
    Profile,
    ProfileChange,
    SeizureServiceController,
    SeizureServiceControllerMethods,
    Void
} from '../../generated_proto/hero';

import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { ValidatedGuard } from 'src/common/guards/validated.guard';
import { GrpcService } from 'src/common/services/grpc.service';
import { SeizureService } from './seizure.service';


@UseGuards(ValidatedGuard)
@Controller()
@SeizureServiceControllerMethods()
export class SeizureController implements SeizureServiceController {
  constructor(
    private readonly service: SeizureService,
    private readonly grpcService: GrpcService,
  ) {}
    create(request: Profile, metadata?: Metadata): Void | Promise<Void> | Observable<Void> {
        throw new Error('Method not implemented.');
    }
    delete(request: Profile, metadata?: Metadata): Void | Promise<Void> | Observable<Void> {
        throw new Error('Method not implemented.');
    }
    get(request: Void, metadata?: Metadata): Profile | Promise<Profile> | Observable<Profile> {
        throw new Error('Method not implemented.');
    }
    stream(request: Void, metadata?: Metadata): Observable<ProfileChange> {
        throw new Error('Method not implemented.');
    }

}
