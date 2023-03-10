import 'package:dart_test_client/generated/hero.pbgrpc.dart';
import 'package:grpc/grpc.dart';
import 'package:test/test.dart';

void main() {
  group('HeroService', () {
    late ClientChannel channel;
    late HeroServiceClient stub;

    setUp(() async {
      channel = ClientChannel(
        '0.0.0.0',
        port: 50051,
        options: const ChannelOptions(
          credentials: ChannelCredentials.insecure(),
        ),
      );
      stub = HeroServiceClient(channel);
    });

    tearDown(() async {
      await channel.shutdown();
    });

    test('FindOne', () async {
      final request = HeroById()..id = 1;
      final response = await stub.findOne(request);

      expect(response.id, equals(1));
      expect(response.name, equals('Jahn'));
    });

    test('PingStream', () async {
      final request = Ping()..id = 1;

      final responseStream = stub.pingStream(
        Stream.periodic(Duration(seconds: 10), (i) => request),
      );

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
  });
}
