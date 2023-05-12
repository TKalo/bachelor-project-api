import 'dart:async';
import 'dart:math';

import 'package:grpc/grpc.dart';

import '../connection.dart';
import '../generated_proto/hero.pbgrpc.dart';
import 'general_test.dart';

class Output {
  final int best;
  final int worst;
  final int average;

  Output({required this.best, required this.worst, required this.average});
}

streamTest({required iterations, required clients, required messages}) async {
  for (int x = 0; x < iterations; x++) {
    final tester = GeneralTest<Output>(
      clients: clients,
      timeoutSeconds: 360,
      client: () => client(messages),
      printer: printer,
    );

    await tester.run();
  }
}

Future<Output> client(int messages) async {
  final id = getRandomString(3);
  ClientChannel channel = await Connection().connect();
  AuthServiceClient authClient = AuthServiceClient(channel);
  SeizureServiceClient seizureClient = SeizureServiceClient(channel);

  final tokens = await authClient.signUp(
    Credentials(email: getRandomString(20), password: getRandomString(3)),
  );
  final metadata = <String, String>{
    'Authentication': 'Bearer ${tokens.accessToken}'
  };

  final requestStream = StreamController<SeizureFilter>();

  Timer.periodic(Duration(seconds: 1), (timer) {
    requestStream.add(SeizureFilter());
  });

  final stream = seizureClient
      .stream(
        requestStream.stream,
        options: CallOptions(metadata: metadata),
      )
      .asBroadcastStream();

  final emits = [];

  final List<int> timings = [];

  await Future.delayed(Duration(seconds: 1));
  for (int x = 0; x < messages; x++) {
    await Future.delayed(Duration(milliseconds: Random().nextInt(1000) + 500));
    DateTime start = DateTime.now();

    seizureClient.create(
      Seizure(type: SeizureType.Tonic, durationSeconds: x),
      options: CallOptions(metadata: metadata),
    );
    try {
      emits.add(await stream.timeout(Duration(seconds: 20)).first);
    } catch (e) {
      print("[$id] : $x lost message - ${DateTime.now()}");
      break;
    }

    timings.add(DateTime.now().difference(start).inMilliseconds);
  }

  channel.shutdown();

  timings.sort((a, b) => a.compareTo(b));

  double average = 0;
  timings.forEach((r) => average += r / timings.length);

  return Output(
    best: timings.length != 0 ? timings.first : 0,
    worst: timings.length != 0 ? timings.last : 0,
    average: timings.length != 0 ? average.toInt() : 0,
  );
}

printer(List<Output> results) {
  int? best;
  int? worst;
  double average = 0;

  for (final output in results) {
    if (best == null || output.best < best) best = output.best;
    if (worst == null || output.worst > worst) worst = output.worst;
    average += output.average / results.length;
  }

  print('RESULTS best: $best worst: $worst average: ${average.toInt()}');
}

const _chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890';
Random _rnd = Random();

String getRandomString(int length) {
  return String.fromCharCodes(
    Iterable.generate(
      length,
      (_) => _chars.codeUnitAt(_rnd.nextInt(_chars.length)),
    ),
  );
}
