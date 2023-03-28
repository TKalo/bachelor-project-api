import 'package:grpc/grpc.dart';

class Connection {
  Future<ClientChannel> connect() async {
    await Future.delayed(Duration(seconds: 2));
    ClientChannel channel = ClientChannel(
      'api',
      port: 50051,
      options: const ChannelOptions(
        credentials: ChannelCredentials.insecure(),
      ),
    );

    return channel;
  }
}
