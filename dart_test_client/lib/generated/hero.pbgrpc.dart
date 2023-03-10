///
//  Generated code. Do not modify.
//  source: hero.proto
//
// @dart = 2.12
// ignore_for_file: annotate_overrides,camel_case_types,constant_identifier_names,directives_ordering,library_prefixes,non_constant_identifier_names,prefer_final_fields,return_of_invalid_type,unnecessary_const,unnecessary_import,unnecessary_this,unused_import,unused_shown_name

import 'dart:async' as $async;

import 'dart:core' as $core;

import 'package:grpc/service_api.dart' as $grpc;
import 'hero.pb.dart' as $0;
export 'hero.pb.dart';

class HeroServiceClient extends $grpc.Client {
  static final _$findOne = $grpc.ClientMethod<$0.HeroById, $0.Hero>(
      '/hero.HeroService/FindOne',
      ($0.HeroById value) => value.writeToBuffer(),
      ($core.List<$core.int> value) => $0.Hero.fromBuffer(value));
  static final _$pingStream = $grpc.ClientMethod<$0.Ping, $0.Ping>(
      '/hero.HeroService/PingStream',
      ($0.Ping value) => value.writeToBuffer(),
      ($core.List<$core.int> value) => $0.Ping.fromBuffer(value));

  HeroServiceClient($grpc.ClientChannel channel,
      {$grpc.CallOptions? options,
      $core.Iterable<$grpc.ClientInterceptor>? interceptors})
      : super(channel, options: options, interceptors: interceptors);

  $grpc.ResponseFuture<$0.Hero> findOne($0.HeroById request,
      {$grpc.CallOptions? options}) {
    return $createUnaryCall(_$findOne, request, options: options);
  }

  $grpc.ResponseStream<$0.Ping> pingStream($async.Stream<$0.Ping> request,
      {$grpc.CallOptions? options}) {
    return $createStreamingCall(_$pingStream, request, options: options);
  }
}

abstract class HeroServiceBase extends $grpc.Service {
  $core.String get $name => 'hero.HeroService';

  HeroServiceBase() {
    $addMethod($grpc.ServiceMethod<$0.HeroById, $0.Hero>(
        'FindOne',
        findOne_Pre,
        false,
        false,
        ($core.List<$core.int> value) => $0.HeroById.fromBuffer(value),
        ($0.Hero value) => value.writeToBuffer()));
    $addMethod($grpc.ServiceMethod<$0.Ping, $0.Ping>(
        'PingStream',
        pingStream,
        true,
        true,
        ($core.List<$core.int> value) => $0.Ping.fromBuffer(value),
        ($0.Ping value) => value.writeToBuffer()));
  }

  $async.Future<$0.Hero> findOne_Pre(
      $grpc.ServiceCall call, $async.Future<$0.HeroById> request) async {
    return findOne(call, await request);
  }

  $async.Future<$0.Hero> findOne($grpc.ServiceCall call, $0.HeroById request);
  $async.Stream<$0.Ping> pingStream(
      $grpc.ServiceCall call, $async.Stream<$0.Ping> request);
}
