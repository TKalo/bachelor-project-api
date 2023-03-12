import 'package:dart_test_client/generated/hero.pbgrpc.dart';
import 'package:grpc/grpc.dart';
import 'package:test/test.dart';

void main() {
  group('HeroService', () {
    late ClientChannel channel;
    late HeroServiceClient stub;

    setUpAll(() async {
      await Future.delayed(Duration(seconds: 1));
      channel = ClientChannel(
        'api',
        port: 50051,
        options: const ChannelOptions(
          credentials: ChannelCredentials.insecure(),
        ),
      );
      stub = HeroServiceClient(channel);
    });

    tearDownAll(() async {
      await channel.shutdown();
    });

    test('FindOne', () async {
      final request = HeroById()..id = 1;
      final response = await stub.findOne(request);

      expect(response.id, equals(1));
      expect(response.name, equals('Jahn'));
    });

    test('PingStream', () async {
      final responseStream = stub.pingStream(Void());

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
      final responseStream = stub.messageStream(Void());

      final String message = 'Hello world';
      stub.addMessage(Message(id: 1, message: message));
      stub.addMessage(Message(id: 1, message: message));
      stub.addMessage(Message(id: 1, message: message));

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
