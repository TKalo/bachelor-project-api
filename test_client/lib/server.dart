import 'dart:math';

import 'package:dart_test_client/generated_proto/hero.pbgrpc.dart';
import 'package:dart_test_client/connection.dart';
import 'package:grpc/grpc.dart';
import 'package:test/test.dart';

void main() {
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
      final input = Credentials(email: "email1", password: "password1");
      final response = await authClient.signUp(input);

      expect(response.accessToken != "", true);
      expect(response.refreshToken != "", true);
    });

    test(
      'SignUp - when taken email is given, should throw ${AuthServiceError.AUTH_EMAIL_TAKEN}',
      () async {
        final input = Credentials(email: "email1", password: "password2");
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
            Credentials(email: "email1", password: "invalid password");
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
        final input = Credentials(email: "email1", password: "password1");
        final response = await authClient.signIn(input);

        expect(response.accessToken != "", true);
        expect(response.refreshToken != "", true);
      },
    );

    test(
      'refreshAccessToken - when invalid refreshToken is given, should throw ${AuthSessionServiceError.AUTH_SESSION_INVALID_REFRESH_TOKEN}',
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
              AuthSessionServiceError.AUTH_SESSION_INVALID_REFRESH_TOKEN.name,
            ),
          ),
        );
      },
    );

    test(
      'refreshAccessToken - when valid refreshToken is given, should return new auth tokens',
      () async {
        final input = Credentials(email: "email1", password: "password1");
        final signInResponse = await authClient.signIn(input);

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
      'signOut - when invalid refreshToken is given, should throw ${AuthSessionServiceError.AUTH_SESSION_INVALID_REFRESH_TOKEN}',
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
              AuthSessionServiceError.AUTH_SESSION_INVALID_REFRESH_TOKEN.name,
            ),
          ),
        );
      },
    );

    test(
      'signOut - when valid refreshToken is given, should remove session',
      () async {
        final input = Credentials(email: "email1", password: "password1");
        final signInResponse = await authClient.signIn(input);

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
}
