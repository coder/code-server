// package: 
// file: client.proto

import * as jspb from "google-protobuf";
import * as node_pb from "./node_pb";
import * as vscode_pb from "./vscode_pb";

export class ClientMessage extends jspb.Message {
  hasMethod(): boolean;
  clearMethod(): void;
  getMethod(): node_pb.MethodMessage | undefined;
  setMethod(value?: node_pb.MethodMessage): void;

  hasPing(): boolean;
  clearPing(): void;
  getPing(): node_pb.Ping | undefined;
  setPing(value?: node_pb.Ping): void;

  getMsgCase(): ClientMessage.MsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ClientMessage): ClientMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ClientMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientMessage;
  static deserializeBinaryFromReader(message: ClientMessage, reader: jspb.BinaryReader): ClientMessage;
}

export namespace ClientMessage {
  export type AsObject = {
    method?: node_pb.MethodMessage.AsObject,
    ping?: node_pb.Ping.AsObject,
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    METHOD = 20,
    PING = 21,
  }
}

export class ServerMessage extends jspb.Message {
  hasFail(): boolean;
  clearFail(): void;
  getFail(): node_pb.FailMessage | undefined;
  setFail(value?: node_pb.FailMessage): void;

  hasSuccess(): boolean;
  clearSuccess(): void;
  getSuccess(): node_pb.SuccessMessage | undefined;
  setSuccess(value?: node_pb.SuccessMessage): void;

  hasEvent(): boolean;
  clearEvent(): void;
  getEvent(): node_pb.EventMessage | undefined;
  setEvent(value?: node_pb.EventMessage): void;

  hasCallback(): boolean;
  clearCallback(): void;
  getCallback(): node_pb.CallbackMessage | undefined;
  setCallback(value?: node_pb.CallbackMessage): void;

  hasPong(): boolean;
  clearPong(): void;
  getPong(): node_pb.Pong | undefined;
  setPong(value?: node_pb.Pong): void;

  hasInit(): boolean;
  clearInit(): void;
  getInit(): WorkingInitMessage | undefined;
  setInit(value?: WorkingInitMessage): void;

  hasSharedProcessActive(): boolean;
  clearSharedProcessActive(): void;
  getSharedProcessActive(): vscode_pb.SharedProcessActiveMessage | undefined;
  setSharedProcessActive(value?: vscode_pb.SharedProcessActiveMessage): void;

  getMsgCase(): ServerMessage.MsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessage): ServerMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessage;
  static deserializeBinaryFromReader(message: ServerMessage, reader: jspb.BinaryReader): ServerMessage;
}

export namespace ServerMessage {
  export type AsObject = {
    fail?: node_pb.FailMessage.AsObject,
    success?: node_pb.SuccessMessage.AsObject,
    event?: node_pb.EventMessage.AsObject,
    callback?: node_pb.CallbackMessage.AsObject,
    pong?: node_pb.Pong.AsObject,
    init?: WorkingInitMessage.AsObject,
    sharedProcessActive?: vscode_pb.SharedProcessActiveMessage.AsObject,
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    FAIL = 13,
    SUCCESS = 14,
    EVENT = 19,
    CALLBACK = 22,
    PONG = 18,
    INIT = 16,
    SHARED_PROCESS_ACTIVE = 17,
  }
}

export class WorkingInitMessage extends jspb.Message {
  getHomeDirectory(): string;
  setHomeDirectory(value: string): void;

  getTmpDirectory(): string;
  setTmpDirectory(value: string): void;

  getDataDirectory(): string;
  setDataDirectory(value: string): void;

  getWorkingDirectory(): string;
  setWorkingDirectory(value: string): void;

  getOperatingSystem(): WorkingInitMessage.OperatingSystem;
  setOperatingSystem(value: WorkingInitMessage.OperatingSystem): void;

  getShell(): string;
  setShell(value: string): void;

  getBuiltinExtensionsDir(): string;
  setBuiltinExtensionsDir(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WorkingInitMessage.AsObject;
  static toObject(includeInstance: boolean, msg: WorkingInitMessage): WorkingInitMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WorkingInitMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WorkingInitMessage;
  static deserializeBinaryFromReader(message: WorkingInitMessage, reader: jspb.BinaryReader): WorkingInitMessage;
}

export namespace WorkingInitMessage {
  export type AsObject = {
    homeDirectory: string,
    tmpDirectory: string,
    dataDirectory: string,
    workingDirectory: string,
    operatingSystem: WorkingInitMessage.OperatingSystem,
    shell: string,
    builtinExtensionsDir: string,
  }

  export enum OperatingSystem {
    WINDOWS = 0,
    LINUX = 1,
    MAC = 2,
  }
}

