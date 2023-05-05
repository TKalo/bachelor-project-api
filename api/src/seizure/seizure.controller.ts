import { Controller, UseGuards } from '@nestjs/common';
import {
  Seizure,
  SeizureChange,
  SeizureFilter,
  SeizureList,
  SeizureServiceController,
  SeizureServiceControllerMethods,
  Void,
} from '../../generated_proto/hero';

import { Metadata } from '@grpc/grpc-js';
import { Observable, Subject, map } from 'rxjs';
import { ValidatedGuard } from 'src/common/guards/validated.guard';
import { GrpcService } from 'src/common/services/grpc.service';
import { SeizureType } from '../../generated_proto/hero';
import { SeizureDataInsufficientError } from './errors/seizure-data-insufficient.error';
import { SeizureDataInsufficientGrpcError } from './errors/seizure-data-insufficient.grpc-error';
import { SeizureInternalGrpcError } from './errors/seizure-internal.grpc-error';
import { SeizureService } from './seizure.service';
import { SeizureDoesNotExistError } from './errors/seizure-does-not-exist.error';
import { SeizureDoesNotExistGrpcError } from './errors/seizure-does-not-exist.grpc-error';

@UseGuards(ValidatedGuard)
@Controller()
@SeizureServiceControllerMethods()
export class SeizureController implements SeizureServiceController {
  constructor(
    private readonly service: SeizureService,
    private readonly grpcService: GrpcService,
  ) {}
  create(
    request: Seizure,
    metadata?: Metadata,
  ): Void | Promise<Void> | Observable<Void> {
    return new Promise<Void>(async (resolve, reject) => {
      try {
        this.service.validation(request.durationSeconds, request.type);

        const accessToken = this.grpcService.extractToken(metadata);

        await this.service.create(
          accessToken,
          request.type,
          request.durationSeconds,
        );

        resolve({});
      } catch (e) {
        if (e.message === new SeizureDataInsufficientError().message) {
          reject(new SeizureDataInsufficientGrpcError());
        } else {
          reject(new SeizureInternalGrpcError());
        }
      }
    });
  }
  delete(
    request: Seizure,
    metadata?: Metadata,
  ): Void | Promise<Void> | Observable<Void> {
    return new Promise<Void>(async (resolve, reject) => {
      try {
        this.service.validation(request.durationSeconds, request.type);

        const accessToken = this.grpcService.extractToken(metadata);

        await this.service.delete(accessToken, request.id);

        resolve({});
      } catch (e) {
        if (e.message === new SeizureDataInsufficientError().message) {
          reject(new SeizureDataInsufficientGrpcError());
        } else if (e.message == new SeizureDoesNotExistError().message) {
          reject(new SeizureDoesNotExistGrpcError());
        } else {
          reject(new SeizureInternalGrpcError());
        }
      }
    });
  }
  get(
    request: SeizureFilter,
    metadata?: Metadata,
  ): SeizureList | Promise<SeizureList> | Observable<SeizureList> {
    return new Promise<SeizureList>(async (resolve, reject) => {
      try {
        const accessToken = this.grpcService.extractToken(metadata);

        const seizures = await this.service.get(
          accessToken,
          request.durationSecondsFrom,
          request.durationSecondsTo,
        );

        const grpcSeizures: Seizure[] = seizures.map((value) => {
          return {
            id: value._id.toHexString(),
            type: SeizureType[SeizureType[value.type]],
            durationSeconds: value.duration,
          };
        });

        resolve({
          seizures: grpcSeizures,
        });
      } catch (e) {
        if (e.message === new SeizureDataInsufficientError().message) {
          reject(new SeizureDataInsufficientGrpcError());
        } else {
          reject(new SeizureInternalGrpcError());
        }
      }
    });
  }
 
  stream(
    request: Observable<SeizureFilter>,
    metadata?: Metadata,
  ): Observable<SeizureChange> {
    try {
      const accessToken = this.grpcService.extractToken(metadata);

      const returnStream = new Subject<SeizureChange>();

      let filter: SeizureFilter;

      let ping: number;

      let dataStream: Subject<any>;

      const cancelStreams = () => {
        console.log('CANCELLED');
        returnStream.complete();
        dataStream.complete();
      };

      setTimeout(() => {
        if (ping < Date.now() - 5000) {
          cancelStreams();
        }
      }, 5000);

      request.subscribe({
        next: (value) => {
          ping = Date.now();
          if (filter == undefined) {
            console.log('FIRST');
            filter = value;

            dataStream = this.service.stream(
              accessToken,
              filter.durationSecondsFrom,
              filter.durationSecondsTo,
            );

            dataStream.subscribe({
              next: (data) => {
                returnStream.next({
                  change: data.change,
                  seizure: {
                    id: data.seizure._id.toHexString(),
                    type: SeizureType[SeizureType[data.seizure.type]],
                    durationSeconds: data.seizure.duration,
                  },
                });
              },
            });
          }
        },
        complete: () => cancelStreams(),
        error: () => cancelStreams(),
      });

      return returnStream;
    } catch (e) {
      throw new SeizureInternalGrpcError();
    }
  }
}
