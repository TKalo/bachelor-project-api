import { Controller, UseGuards } from '@nestjs/common';
import {
  Profile,
  ProfileChange,
  ProfileServiceController,
  ProfileServiceControllerMethods,
  Void,
} from '../../generated_proto/hero';

import { Metadata } from '@grpc/grpc-js';
import { Observable, map } from 'rxjs';
import { ValidatedGuard } from 'src/common/guards/validated.guard';
import { GrpcService } from 'src/common/services/grpc.service';
import { ProfileDataInsufficientError } from './errors/profile-data-insufficient.error';
import { ProfileDataInsufficientGrpcError } from './errors/profile-data-insufficient.grpc-error';
import { ProfileDoesNotExistError } from './errors/profile-does-not-exist.error';
import { ProfileDoesNotExistGrpcError } from './errors/profile-does-not-exist.grpc-error';
import { ProfileInternalGrpcError } from './errors/profile-internal.grpc-error';
import { HasNoProfileGuard } from './guards/has-no-profile.guard';
import { HasProfileGuard } from './guards/has-profile.guard';
import { ProfileService } from './profile.service';
import { ProfileValidationService } from './profile.validation';

@UseGuards(ValidatedGuard)
@Controller()
@ProfileServiceControllerMethods()
export class ProfileController implements ProfileServiceController {
  constructor(
    private readonly service: ProfileService,
    private readonly grpcService: GrpcService,
    private readonly validation: ProfileValidationService,
  ) {}

  @UseGuards(HasNoProfileGuard)
  createProfile(
    request: Profile,
    metadata: Metadata,
  ): Void | Promise<Void> | Observable<Void> {
    return new Promise<Void>(async (resolve, reject) => {
      try {
        this.validation.nameValidation(request);

        const accessToken = this.grpcService.extractToken(metadata);

        await this.service.createProfile(accessToken, request.name);

        resolve({});
      } catch (e) {
        if (e.message === new ProfileDataInsufficientError().message) {
          reject(new ProfileDataInsufficientGrpcError());
        } else {
          reject(new ProfileInternalGrpcError());
        }
      }
    });
  }

  @UseGuards(HasProfileGuard)
  updateProfile(
    request: Profile,
    metadata: Metadata,
  ): Void | Promise<Void> | Observable<Void> {
    return new Promise<Void>(async (resolve, reject) => {
      try {
        this.validation.nameValidation(request);

        const accessToken = this.grpcService.extractToken(metadata);

        await this.service.updateProfile(accessToken, request.name);

        resolve({});
      } catch (e) {
        if (e.message === new ProfileDataInsufficientError().message) {
          reject(new ProfileDataInsufficientGrpcError());
        } else if (e.message === new ProfileDoesNotExistError().message) {
          reject(new ProfileDoesNotExistGrpcError());
        } else {
          reject(new ProfileInternalGrpcError());
        }
      }
    });
  }

  @UseGuards(HasProfileGuard)
  getProfile(
    request: Void,
    metadata: Metadata,
  ): Profile | Promise<Profile> | Observable<Profile> {
    return new Promise<Profile>(async (resolve, reject) => {
      try {
        const accessToken = this.grpcService.extractToken(metadata);

        const profile = await this.service.getProfile(accessToken);

        resolve({
          name: profile.name,
        });
      } catch (e) {
        reject(new ProfileInternalGrpcError());
      }
    });
  }

  @UseGuards(HasProfileGuard)
  streamProfile(request: Void, metadata?: Metadata): Observable<ProfileChange> {
    try {
      const accessToken = this.grpcService.extractToken(metadata);

      const stream = this.service.streamProfile(accessToken);

      return stream.pipe<ProfileChange>(
        map((data) => ({
          changeType: data.change,
          profile: {
            name: data.profile.name,
          },
        })),
      );
    } catch (e) {
      throw new ProfileInternalGrpcError();
    }
  }
}