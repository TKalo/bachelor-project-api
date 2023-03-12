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
  static final _$pingStream = $grpc.ClientMethod<$0.Void, $0.Ping>(
      '/hero.HeroService/PingStream',
      ($0.Void value) => value.writeToBuffer(),
      ($core.List<$core.int> value) => $0.Ping.fromBuffer(value));
  static final _$addMessage = $grpc.ClientMethod<$0.Message, $0.Void>(
      '/hero.HeroService/AddMessage',
      ($0.Message value) => value.writeToBuffer(),
      ($core.List<$core.int> value) => $0.Void.fromBuffer(value));
  static final _$messageStream = $grpc.ClientMethod<$0.Void, $0.Message>(
      '/hero.HeroService/MessageStream',
      ($0.Void value) => value.writeToBuffer(),
      ($core.List<$core.int> value) => $0.Message.fromBuffer(value));

  HeroServiceClient($grpc.ClientChannel channel,
      {$grpc.CallOptions? options,
      $core.Iterable<$grpc.ClientInterceptor>? interceptors})
      : super(channel, options: options, interceptors: interceptors);

  $grpc.ResponseFuture<$0.Hero> findOne($0.HeroById request,
      {$grpc.CallOptions? options}) {
    return $createUnaryCall(_$findOne, request, options: options);
  }

  $grpc.ResponseStream<$0.Ping> pingStream($0.Void request,
      {$grpc.CallOptions? options}) {
    return $createStreamingCall(
        _$pingStream, $async.Stream.fromIterable([request]),
        options: options);
  }

  $grpc.ResponseFuture<$0.Void> addMessage($0.Message request,
      {$grpc.CallOptions? options}) {
    return $createUnaryCall(_$addMessage, request, options: options);
  }

  $grpc.ResponseStream<$0.Message> messageStream($0.Void request,
      {$grpc.CallOptions? options}) {
    return $createStreamingCall(
        _$messageStream, $async.Stream.fromIterable([request]),
        options: options);
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
    $addMethod($grpc.ServiceMethod<$0.Void, $0.Ping>(
        'PingStream',
        pingStream_Pre,
        false,
        true,
        ($core.List<$core.int> value) => $0.Void.fromBuffer(value),
        ($0.Ping value) => value.writeToBuffer()));
    $addMethod($grpc.ServiceMethod<$0.Message, $0.Void>(
        'AddMessage',
        addMessage_Pre,
        false,
        false,
        ($core.List<$core.int> value) => $0.Message.fromBuffer(value),
        ($0.Void value) => value.writeToBuffer()));
    $addMethod($grpc.ServiceMethod<$0.Void, $0.Message>(
        'MessageStream',
        messageStream_Pre,
        false,
        true,
        ($core.List<$core.int> value) => $0.Void.fromBuffer(value),
        ($0.Message value) => value.writeToBuffer()));
  }

  $async.Future<$0.Hero> findOne_Pre(
      $grpc.ServiceCall call, $async.Future<$0.HeroById> request) async {
    return findOne(call, await request);
  }

  $async.Stream<$0.Ping> pingStream_Pre(
      $grpc.ServiceCall call, $async.Future<$0.Void> request) async* {
    yield* pingStream(call, await request);
  }

  $async.Future<$0.Void> addMessage_Pre(
      $grpc.ServiceCall call, $async.Future<$0.Message> request) async {
    return addMessage(call, await request);
  }

  $async.Stream<$0.Message> messageStream_Pre(
      $grpc.ServiceCall call, $async.Future<$0.Void> request) async* {
    yield* messageStream(call, await request);
  }

  $async.Future<$0.Hero> findOne($grpc.ServiceCall call, $0.HeroById request);
  $async.Stream<$0.Ping> pingStream($grpc.ServiceCall call, $0.Void request);
  $async.Future<$0.Void> addMessage($grpc.ServiceCall call, $0.Message request);
  $async.Stream<$0.Message> messageStream(
      $grpc.ServiceCall call, $0.Void request);
}
