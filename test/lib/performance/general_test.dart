import 'dart:async';
import 'dart:isolate';

class GeneralTest<T> {
  final Future<T> Function() client;
  final Function(List<T>) printer;
  final List<T> results = [];
  final int clients;
  final int timeoutSeconds;

  GeneralTest({
    required this.clients,
    required this.timeoutSeconds,
    required this.client,
    required this.printer,
  });

  Future<void> run() async {
    for (int x = 0; x < clients; x++) _spawn(x);

    await _publish();
  }

  void _spawn(int x) async {
    try {
      final p = ReceivePort();

      final isolate = await Isolate.spawn<SendPort>(_test, p.sendPort);

      final timeout =
          Timer(Duration(seconds: timeoutSeconds), () => isolate.kill());

      results
          .add(await p.timeout(Duration(seconds: timeoutSeconds)).first as T);

      timeout.cancel();
    } catch (e) {}
  }

  void _test(SendPort input) async {
    final output = await client();

    Isolate.exit(input, output);
  }

  Future<void> _publish() async {
    final startTime = DateTime.now();
    while (results.length < clients * 0.99 &&
        DateTime.now().difference(startTime).inSeconds < timeoutSeconds) {
      await Future.delayed(Duration(seconds: 1));
    }

    printer(results);
  }
}
