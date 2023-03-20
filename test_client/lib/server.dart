import 'package:dart_test_client/generated_proto/hero.pbgrpc.dart';
import 'package:dart_test_client/generated_proto/test_env.dart';
import 'package:grpc/grpc.dart';
import 'package:test/test.dart';

void main() {
  group('HeroService', () {
    late TestEnv env;

    setUpAll(() async {
      env = await TestEnv().connect();
    });

    tearDownAll(() async {
      await env.channel.shutdown();
    });

    test('ReturnToken', () async {
      final metadata = <String, String>{'Authentication': 'Bearer <token>'};

      final request = Void();

      final response = await env.stub.returnToken(
        request,
        options: CallOptions(metadata: metadata),
      );

      expect(response.message, '<token>');
    });

    test('FindOne', () async {
      final request = HeroById()..id = 1;
      final response = await env.stub.findOne(request);

      expect(response.id, equals(1));
      expect(response.name, equals('Jahn'));
    });

    test('PingStream', () async {
      final responseStream = env.stub.pingStream(Void());

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
      final responseStream = env.stub.messageStream(Void());

      final String message = 'insert';
      env.stub.addMessage(Message(id: 1, message: message));
      env.stub.addMessage(Message(id: 1, message: message));
      env.stub.addMessage(Message(id: 1, message: message));

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
}
