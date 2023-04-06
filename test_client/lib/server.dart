import 'package:dart_test_client/connection.dart';
import 'package:dart_test_client/generated_proto/hero.pbgrpc.dart';
import 'package:grpc/grpc.dart';
import 'package:test/test.dart';

void main() {
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
      await Future.delayed(Duration(seconds: 2));

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
      'getProfile - when no profile exists, should throw ${ProfileServiceError.PROFILE_DOES_NOT_EXIST}',
      () async {
        expect(
          () async {
            return await client.getProfile(
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
      'streamProfile - when no profile exists, should throw ${ProfileServiceError.PROFILE_DOES_NOT_EXIST}',
      () async {
        final outputStream = await client.streamProfile(
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
        'updateProfile - when no profile exists, should throw ${ProfileServiceError.PROFILE_DOES_NOT_EXIST}',
        () async {
      final input = Profile(name: nameValid1);

      expect(
        () async {
          return await client.updateProfile(
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
        'createProfile - when invalid access token given, should throw ${ValidationError.VALIDATION_INVALID_ACCESS_TOKEN}',
        () async {
      final input = Profile(name: nameValid1);

      expect(
        () async {
          return await client.createProfile(
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
        'createProfile - when name shorter than 3 characters given, should tthrow ${ProfileServiceError.PROFILE_DATA_INSUFFICIENT}',
        () async {
      final input = Profile(name: nameInvalid);

      expect(
        () async {
          return await client.createProfile(
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
      'createProfile - when name longer than 2 characters given, should return created profile',
      () async {
        final input = Profile(name: nameValid1);

        await client.createProfile(
          input,
          options: CallOptions(metadata: metadataValid),
        );

        await Future.delayed(Duration(seconds: 1));

        final output = await client.getProfile(
          Void(),
          options: CallOptions(metadata: metadataValid),
        );

        expect(output.name, nameValid1);
      },
    );

    test(
      'createProfile - when profile exists, should throw ${ProfileServiceError.PROFILE_EXISTS}',
      () async {
        final input = Profile(name: nameValid1);

        expect(
          () async {
            return await client.createProfile(
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
        'updateProfile - when invalid access token given, should throw ${ValidationError.VALIDATION_INVALID_ACCESS_TOKEN}',
        () async {
      final input = Profile(name: nameValid1);

      expect(
        () async {
          return await client.updateProfile(
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
      'updateProfile - when name shorter than 3 characters given, should throw ${ProfileServiceError.PROFILE_DATA_INSUFFICIENT}',
      () async {
        final input = Profile(name: nameInvalid);

        expect(
          () async {
            return await client.updateProfile(
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
      'updateProfile - when name longer than 2 characters given, should return success',
      () async {
        final input = Profile(name: nameValid2);

        await client.updateProfile(
          input,
          options: CallOptions(metadata: metadataValid),
        );

        await Future.delayed(Duration(seconds: 1));

        final output = await client.getProfile(
          Void(),
          options: CallOptions(metadata: metadataValid),
        );

        expect(output.name, nameValid2);
      },
    );

    test(
      'getProfile - when profile exists, should return profile',
      () async {
        final output = await client.getProfile(
          Void(),
          options: CallOptions(metadata: metadataValid),
        );

        expect(output.name, nameValid2);
      },
    );

    test(
      'streamProfile - when profile exists, should stream changes to profile',
      () async {
        final outputStream = await client.streamProfile(
          Void(),
          options: CallOptions(metadata: metadataValid),
        );

        final input = Profile(name: nameValid1);

        await client.updateProfile(
          input,
          options: CallOptions(metadata: metadataValid),
        );

        await expectLater(
          outputStream,
          emitsInOrder([
            ProfileChange(
              changeType: ChangeType.UPDATE,
              profile: Profile(name: nameValid1),
            ),
          ]),
        );
      },
    );
  });
}
