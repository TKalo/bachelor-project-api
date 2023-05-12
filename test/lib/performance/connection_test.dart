import 'package:grpc/grpc.dart';

import '../connection.dart';
import 'general_test.dart';

class Output {
  final int totalRuntime;

  Output({required this.totalRuntime});
}

final clients = 3000;

connectionTest() {
  GeneralTest<Output>(
    clients: clients,
    timeoutSeconds: 10,
    client: client,
    printer: printer,
  );
}

Future<Output> client() async {
  final startTime = DateTime.now();
  ClientChannel channel = await Connection().connect();
  channel.shutdown();
  final endTime = DateTime.now();
  return Output(
    totalRuntime: endTime.difference(startTime).inMilliseconds,
  );
}

printer(List<Output> results) {
  results.sort((a, b) => a.totalRuntime.compareTo(b.totalRuntime));
  int bestTime = results.first.totalRuntime;
  int worstTime = results.last.totalRuntime;
  double average = 0;
  results.forEach((r) => average += r.totalRuntime / clients);

  print('RESULTS\n\tworst: $worstTime\n\tbest: $bestTime\t\naverage: $average');
}
