import 'package:grpc/grpc.dart';
import 'package:test/test.dart';

import '../connection.dart';
import '../generated_proto/hero.pbgrpc.dart';

void integrationTests() {
  final valid_email = "valid_email";
  final valid_password = "valid_password";

  group('HeroService', () {
    late ClientChannel channel;
    late HeroServiceClient client;

    setUpAll(() async {
      channel = await Connection().connect();
      client = HeroServiceClient(channel);
    });

    tearDownAll(() async {
      await channel.shutdown();
    });

    test('ReturnToken', () async {
      final metadata = <String, String>{'Authentication': 'Bearer <token>'};

      final request = Void();

      final response = await client.returnToken(
        request,
        options: CallOptions(metadata: metadata),
      );

      expect(response.message, '<token>');
    });

    test('FindOne', () async {
      final request = HeroById()..id = 1;
      final response = await client.findOne(request);

      expect(response.id, equals(1));
      expect(response.name, equals('Jahn'));
    });

    test('PingStream', () async {
      final responseStream = client.pingStream(Void());

      await expectLater(
        responseStream,
        emitsInOrder([
          Ping()..id = 1,
          Ping()..id = 2,
          Ping()..id = 3,
          Ping()..id = 4,
          Ping()..id = 5
        ]),
      );
    });

    test('MessageStream', () async {
      final responseStream = client.messageStream(Void());

      final String message = 'insert';
      client.addMessage(Message(id: 1, message: message));
      client.addMessage(Message(id: 1, message: message));
      client.addMessage(Message(id: 1, message: message));

      await expectLater(
        responseStream,
        emitsInOrder([
          Message(id: 0, message: message),
          Message(id: 1, message: message),
          Message(id: 2, message: message),
        ]),
      );
    });
  });

  group('Auth', () {
    late ClientChannel channel;
    late AuthServiceClient authClient;
    late AuthSessionServiceClient sessionClient;

    setUpAll(() async {
      channel = await Connection().connect();
      authClient = AuthServiceClient(channel);
      sessionClient = AuthSessionServiceClient(channel);
    });

    tearDownAll(() async {
      await channel.shutdown();
    });

    test('SignUp - when valid info is given, should create user', () async {
      final input = Credentials(email: valid_email, password: valid_password);
      final response = await authClient.signUp(input);
      await Future.delayed(Duration(seconds: 1));

      expect(response.accessToken != "", true);
      expect(response.refreshToken != "", true);
    });

    test(
      'SignUp - when taken email is given, should throw ${AuthServiceError.AUTH_EMAIL_TAKEN}',
      () async {
        final input = Credentials(email: valid_email, password: "password2");
        expect(
          () async => await authClient.signUp(input),
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              AuthServiceError.AUTH_EMAIL_TAKEN.name,
            ),
          ),
        );
      },
    );

    test(
      'SignIn - when invalid email is given, should throw ${AuthServiceError.AUTH_USER_NOT_FOUND}',
      () async {
        final input = Credentials(email: "email2", password: "password2");
        expect(
          () async => await authClient.signIn(input),
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              AuthServiceError.AUTH_USER_NOT_FOUND.name,
            ),
          ),
        );
      },
    );

    test(
      'SignIn - when invald password is given, should throw ${AuthServiceError.AUTH_WRONG_PASSWORD}',
      () async {
        final input =
            Credentials(email: valid_email, password: "invalid password");
        expect(
          () async => await authClient.signIn(input),
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              AuthServiceError.AUTH_WRONG_PASSWORD.name,
            ),
          ),
        );
      },
    );

    test(
      'SignIn - when valid credentials are given, should return new auth tokens',
      () async {
        final input = Credentials(email: valid_email, password: valid_password);
        final response = await authClient.signIn(input);

        expect(response.accessToken != "", true);
        expect(response.refreshToken != "", true);
      },
    );

    test(
      'refreshAccessToken - when invalid refreshToken is given, should throw ${ValidationError.VALIDATION_INVALID_REFRESH_TOKEN}',
      () async {
        final metadata = <String, String>{
          'Authentication': 'Bearer <invalid token>'
        };

        expect(
          () async {
            return await sessionClient.refreshAccessToken(
              Void(),
              options: CallOptions(metadata: metadata),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ValidationError.VALIDATION_INVALID_REFRESH_TOKEN.name,
            ),
          ),
        );
      },
    );

    test(
      'refreshAccessToken - when valid refreshToken is given, should return new auth tokens',
      () async {
        final input = Credentials(email: valid_email, password: valid_password);
        final signInResponse = await authClient.signIn(input);
        await Future.delayed(Duration(seconds: 1));

        final metadata = <String, String>{
          'Authentication': 'Bearer ${signInResponse.refreshToken}'
        };

        final refreshResponse = await sessionClient.refreshAccessToken(
          Void(),
          options: CallOptions(metadata: metadata),
        );

        expect(refreshResponse.accessToken != "", true);
        expect(refreshResponse.refreshToken != "", true);
      },
    );

    test(
      'signOut - when invalid refreshToken is given, should throw ${ValidationError.VALIDATION_INVALID_REFRESH_TOKEN}',
      () async {
        final metadata = <String, String>{
          'Authentication': 'Bearer <invalid token>'
        };

        expect(
          () async {
            return await sessionClient.signOut(
              Void(),
              options: CallOptions(metadata: metadata),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ValidationError.VALIDATION_INVALID_REFRESH_TOKEN.name,
            ),
          ),
        );
      },
    );

    test(
      'signOut - when valid refreshToken is given, should remove session',
      () async {
        final input = Credentials(email: valid_email, password: valid_password);
        final signInResponse = await authClient.signIn(input);
        await Future.delayed(Duration(seconds: 1));

        final metadata = <String, String>{
          'Authentication': 'Bearer ${signInResponse.refreshToken}'
        };

        await sessionClient.refreshAccessToken(
          Void(),
          options: CallOptions(metadata: metadata),
        );
      },
    );
  });

  group('Profile', () {
    final nameValid1 = "123";
    final nameValid2 = "1234";
    final nameInvalid = "12";
    late ClientChannel channel;
    late ProfileServiceClient client;
    late AuthServiceClient authClient;
    late Map<String, String> metadataValid;
    late Map<String, String> metadataInvalid = {
      'Authentication': 'Bearer <invalid>'
    };

    setUpAll(() async {
      channel = await Connection().connect();
      client = ProfileServiceClient(channel);
      authClient = AuthServiceClient(channel);

      final input = Credentials(email: valid_email, password: valid_password);

      final tokens = await authClient.signIn(input);

      metadataValid = <String, String>{
        'Authentication': 'Bearer ${tokens.accessToken}'
      };
    });

    tearDownAll(() async {
      await channel.shutdown();
    });

    test(
      'get - when no profile exists, should throw ${ProfileServiceError.PROFILE_DOES_NOT_EXIST}',
      () async {
        expect(
          () async {
            return await client.get(
              Void(),
              options: CallOptions(metadata: metadataValid),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ProfileServiceError.PROFILE_DOES_NOT_EXIST.name,
            ),
          ),
        );
      },
    );

    test(
      'stream - when no profile exists, should throw ${ProfileServiceError.PROFILE_DOES_NOT_EXIST}',
      () async {
        final outputStream = await client.stream(
          Void(),
          options: CallOptions(metadata: metadataValid),
        );

        await expectLater(
          outputStream,
          emitsError(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ProfileServiceError.PROFILE_DOES_NOT_EXIST.name,
            ),
          ),
        );
      },
    );

    test(
        'update - when no profile exists, should throw ${ProfileServiceError.PROFILE_DOES_NOT_EXIST}',
        () async {
      final input = Profile(name: nameValid1);

      expect(
        () async {
          return await client.update(
            input,
            options: CallOptions(metadata: metadataValid),
          );
        },
        throwsA(
          TypeMatcher<GrpcError>().having(
            (e) => e.message,
            'message',
            ProfileServiceError.PROFILE_DOES_NOT_EXIST.name,
          ),
        ),
      );
    });

    test(
        'create - when invalid access token given, should throw ${ValidationError.VALIDATION_INVALID_ACCESS_TOKEN}',
        () async {
      final input = Profile(name: nameValid1);

      expect(
        () async {
          return await client.create(
            input,
            options: CallOptions(metadata: metadataInvalid),
          );
        },
        throwsA(
          TypeMatcher<GrpcError>().having(
            (e) => e.message,
            'message',
            ValidationError.VALIDATION_INVALID_ACCESS_TOKEN.name,
          ),
        ),
      );
    });

    test(
        'create - when name shorter than 3 characters given, should throw ${ProfileServiceError.PROFILE_DATA_INSUFFICIENT}',
        () async {
      final input = Profile(name: nameInvalid);

      expect(
        () async {
          return await client.create(
            input,
            options: CallOptions(metadata: metadataValid),
          );
        },
        throwsA(
          TypeMatcher<GrpcError>().having(
            (e) => e.message,
            'message',
            ProfileServiceError.PROFILE_DATA_INSUFFICIENT.name,
          ),
        ),
      );
    });

    test(
      'create - when name longer than 2 characters given, should return created profile',
      () async {
        final input = Profile(name: nameValid1);

        await client.create(
          input,
          options: CallOptions(metadata: metadataValid),
        );

        await Future.delayed(Duration(seconds: 1));

        final output = await client.get(
          Void(),
          options: CallOptions(metadata: metadataValid),
        );

        expect(output.name, nameValid1);
      },
    );

    test(
      'create - when profile exists, should throw ${ProfileServiceError.PROFILE_EXISTS}',
      () async {
        final input = Profile(name: nameValid1);

        expect(
          () async {
            return await client.create(
              input,
              options: CallOptions(metadata: metadataValid),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ProfileServiceError.PROFILE_EXISTS.name,
            ),
          ),
        );
      },
    );

    test(
        'update - when invalid access token given, should throw ${ValidationError.VALIDATION_INVALID_ACCESS_TOKEN}',
        () async {
      final input = Profile(name: nameValid1);

      expect(
        () async {
          return await client.update(
            input,
            options: CallOptions(metadata: metadataInvalid),
          );
        },
        throwsA(
          TypeMatcher<GrpcError>().having(
            (e) => e.message,
            'message',
            ValidationError.VALIDATION_INVALID_ACCESS_TOKEN.name,
          ),
        ),
      );
    });

    test(
      'update - when name shorter than 3 characters given, should throw ${ProfileServiceError.PROFILE_DATA_INSUFFICIENT}',
      () async {
        final input = Profile(name: nameInvalid);

        expect(
          () async {
            return await client.update(
              input,
              options: CallOptions(metadata: metadataValid),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ProfileServiceError.PROFILE_DATA_INSUFFICIENT.name,
            ),
          ),
        );
      },
    );

    test(
      'update - when name longer than 2 characters given, should return success',
      () async {
        final input = Profile(name: nameValid2);

        await client.update(
          input,
          options: CallOptions(metadata: metadataValid),
        );

        await Future.delayed(Duration(seconds: 1));
        final output = await client.get(
          Void(),
          options: CallOptions(metadata: metadataValid),
        );

        expect(output.name, nameValid2);
      },
    );

    test(
      'get - when profile exists, should return profile',
      () async {
        final output = await client.get(
          Void(),
          options: CallOptions(metadata: metadataValid),
        );

        expect(output.name, nameValid2);
      },
    );

    test(
      'stream - when profile exists, should stream changes to profile',
      () async {
        final outputStream = await client.stream(
          Void(),
          options: CallOptions(metadata: metadataValid),
        );

        final input = Profile(name: nameValid1);

        await Future.delayed(Duration(milliseconds: 500));

        await client.update(
          input,
          options: CallOptions(metadata: metadataValid),
        );

        await expectLater(
          outputStream,
          emitsInOrder([
            ProfileChange(
              change: ChangeType.UPDATE,
              profile: Profile(name: nameValid1),
            ),
          ]),
        );
      },
    );
  });

  group('Seizure', () {
    late ClientChannel channel;
    late SeizureServiceClient client;
    late AuthServiceClient authClient;
    late Map<String, String> metadataValid;
    late Map<String, String> metadataInvalid = {
      'Authentication': 'Bearer <invalid>'
    };

    setUpAll(() async {
      channel = await Connection().connect();
      client = SeizureServiceClient(channel);
      authClient = AuthServiceClient(channel);

      final input = Credentials(email: valid_email, password: valid_password);

      final tokens = await authClient.signIn(input);

      metadataValid = <String, String>{
        'Authentication': 'Bearer ${tokens.accessToken}'
      };
    });

    tearDownAll(() async {
      await channel.shutdown();
    });

    test(
      'create - when invalid AccessToken given, should throw ${ValidationError.VALIDATION_INVALID_ACCESS_TOKEN}',
      () async {
        final input = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: 0,
        );

        expect(
          () async {
            return await client.create(
              input,
              options: CallOptions(metadata: metadataInvalid),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ValidationError.VALIDATION_INVALID_ACCESS_TOKEN.name,
            ),
          ),
        );
      },
    );

    test(
      'create - when negative duration given, should throw ${SeizureServiceError.SEIZURE_NEGATIVE_DURATION}',
      () async {
        final input = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: -1,
        );

        expect(
          () async {
            return await client.create(
              input,
              options: CallOptions(metadata: metadataValid),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              SeizureServiceError.SEIZURE_NEGATIVE_DURATION.name,
            ),
          ),
        );
      },
    );

    test(
      'create - when valid input given, should create seizure',
      () async {
        final uniqueDuration = 0;
        final input = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: uniqueDuration,
        );

        await client.create(
          input,
          options: CallOptions(metadata: metadataValid),
        );

        await Future.delayed(Duration(milliseconds: 2000));

        final output = await client.get(
          SeizureFilter(),
          options: CallOptions(metadata: metadataValid),
        );

        expect(output.seizures.any((s) => s.durationSeconds == uniqueDuration),
            true);
      },
    );

    test(
      'delete - when invalid AccessToken given, should throw ${ValidationError.VALIDATION_INVALID_ACCESS_TOKEN}',
      () async {
        final input = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: 0,
        );

        expect(
          () async {
            return await client.delete(
              input,
              options: CallOptions(metadata: metadataInvalid),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ValidationError.VALIDATION_INVALID_ACCESS_TOKEN.name,
            ),
          ),
        );
      },
    );

    test(
      'delete - when invalid seizure id given, should throw ${SeizureServiceError.SEIZURE_DOES_NOT_EXIST}',
      () async {
        final input = Seizure(
          id: "invalid seizure id",
          type: SeizureType.Tonic,
          durationSeconds: 0,
        );
        expect(
          () async {
            return await client.delete(
              input,
              options: CallOptions(metadata: metadataValid),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              SeizureServiceError.SEIZURE_DOES_NOT_EXIST.name,
            ),
          ),
        );
      },
    );

    test(
      'delete - when valid input given, should delete seizure',
      () async {
        final uniqueDuration = 0;

        final output1 = await client.get(
          SeizureFilter(),
          options: CallOptions(metadata: metadataValid),
        );

        final Seizure? seizure1 = output1.seizures
            .firstWhere((s) => s.durationSeconds == uniqueDuration);

        expect(seizure1 == null, false);

        await client.delete(
          seizure1!,
          options: CallOptions(metadata: metadataValid),
        );

        await Future.delayed(Duration(milliseconds: 500));

        final output2 = await client.get(
          SeizureFilter(),
          options: CallOptions(metadata: metadataValid),
        );

        expect(
            output2.seizures
                .contains((s) => s.durationSeconds == uniqueDuration),
            false);
      },
    );

    test(
      'get - when invalid AccessToken given, should throw ${ValidationError.VALIDATION_INVALID_ACCESS_TOKEN}',
      () async {
        final input = SeizureFilter();

        expect(
          () async {
            return await client.get(
              input,
              options: CallOptions(metadata: metadataInvalid),
            );
          },
          throwsA(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ValidationError.VALIDATION_INVALID_ACCESS_TOKEN.name,
            ),
          ),
        );
      },
    );

    test(
      'get - when filters given, should return seizures in filter',
      () async {
        final duration1 = 1;
        final duration2 = 2;
        final duration3 = 3;
        final duration4 = 4;
        final filter = SeizureFilter(
          durationSecondsFrom: duration2,
          durationSecondsTo: duration3,
        );

        final input1 = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: duration1,
        );

        final input2 = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: duration2,
        );

        final input3 = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: duration3,
        );

        final input4 = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: duration4,
        );

        await client.create(
          input1,
          options: CallOptions(metadata: metadataValid),
        );

        await client.create(
          input2,
          options: CallOptions(metadata: metadataValid),
        );

        await client.create(
          input3,
          options: CallOptions(metadata: metadataValid),
        );

        await client.create(
          input4,
          options: CallOptions(metadata: metadataValid),
        );

        await Future.delayed(Duration(milliseconds: 500));

        final output = await client.get(
          filter,
          options: CallOptions(metadata: metadataValid),
        );

        expect(output.seizures.length, 2);

        expect(output.seizures[0].durationSeconds, duration2);

        expect(output.seizures[1].durationSeconds, duration3);
      },
    );

    test(
      'stream - when invalid AccessToken given, should throw ${ValidationError.VALIDATION_INVALID_ACCESS_TOKEN}',
      () async {
        final outputStream = await client.stream(
          SeizureFilter(),
          options: CallOptions(metadata: metadataInvalid),
        );

        await expectLater(
          outputStream,
          emitsError(
            TypeMatcher<GrpcError>().having(
              (e) => e.message,
              'message',
              ValidationError.VALIDATION_INVALID_ACCESS_TOKEN.name,
            ),
          ),
        );
      },
    );

    test(
      'stream - when filter given, should should stream changes from seizures within filter',
      () async {
        final output1 = await client.get(
          SeizureFilter(),
          options: CallOptions(metadata: metadataValid),
        );

        for (final seizure in output1.seizures) {
          await client.delete(
            seizure,
            options: CallOptions(metadata: metadataValid),
          );
        }

        await Future.delayed(Duration(milliseconds: 500));

        final duration1 = 1;
        final duration2 = 2;
        final duration3 = 3;
        final duration4 = 4;
        final filter = SeizureFilter(
          durationSecondsFrom: duration2,
          durationSecondsTo: duration3,
        );

        final input1 = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: duration1,
        );

        final input2 = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: duration2,
        );

        final input3 = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: duration3,
        );

        final input4 = Seizure(
          id: null,
          type: SeizureType.Tonic,
          durationSeconds: duration4,
        );

        final outputStream = await client.stream(
          filter,
          options: CallOptions(metadata: metadataValid),
        );

        await Future.delayed(Duration(milliseconds: 500));

        await client.create(
          input1,
          options: CallOptions(metadata: metadataValid),
        );

        await client.create(
          input2,
          options: CallOptions(metadata: metadataValid),
        );

        await client.create(
          input3,
          options: CallOptions(metadata: metadataValid),
        );

        await client.create(
          input4,
          options: CallOptions(metadata: metadataValid),
        );

        await Future.delayed(Duration(milliseconds: 500));

        final output2 = await client.get(
          filter,
          options: CallOptions(metadata: metadataValid),
        );

        await expectLater(
          outputStream,
          emitsInOrder([
            SeizureChange(
              change: ChangeType.CREATE,
              seizure: output2.seizures[0],
            ),
            SeizureChange(
              change: ChangeType.CREATE,
              seizure: output2.seizures[1],
            )
          ]),
        );
      },
    );
  });
}
