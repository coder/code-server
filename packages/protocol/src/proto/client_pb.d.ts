// package: 
// file: client.proto

import * as jspb from "google-protobuf";
import * as node_pb from "./node_pb";
import * as vscode_pb from "./vscode_pb";

export class ClientMessage extends jspb.Message {
  hasNewEval(): boolean;
  clearNewEval(): void;
  getNewEval(): node_pb.NewEvalMessage | undefined;
  setNewEval(value?: node_pb.NewEvalMessage): void;

  hasEvalEvent(): boolean;
  clearEvalEvent(): void;
  getEvalEvent(): node_pb.EvalEventMessage | undefined;
  setEvalEvent(value?: node_pb.EvalEventMessage): void;

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
    newEval?: node_pb.NewEvalMessage.AsObject,
    evalEvent?: node_pb.EvalEventMessage.AsObject,
    ping?: node_pb.Ping.AsObject,
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    NEW_EVAL = 11,
    EVAL_EVENT = 12,
    PING = 13,
  }
}

export class ServerMessage extends jspb.Message {
  hasEvalFailed(): boolean;
  clearEvalFailed(): void;
  getEvalFailed(): node_pb.EvalFailedMessage | undefined;
  setEvalFailed(value?: node_pb.EvalFailedMessage): void;

  hasEvalDone(): boolean;
  clearEvalDone(): void;
  getEvalDone(): node_pb.EvalDoneMessage | undefined;
  setEvalDone(value?: node_pb.EvalDoneMessage): void;

  hasEvalEvent(): boolean;
  clearEvalEvent(): void;
  getEvalEvent(): node_pb.EvalEventMessage | undefined;
  setEvalEvent(value?: node_pb.EvalEventMessage): void;

  hasInit(): boolean;
  clearInit(): void;
  getInit(): WorkingInitMessage | undefined;
  setInit(value?: WorkingInitMessage): void;

  hasSharedProcessActive(): boolean;
  clearSharedProcessActive(): void;
  getSharedProcessActive(): vscode_pb.SharedProcessActiveMessage | undefined;
  setSharedProcessActive(value?: vscode_pb.SharedProcessActiveMessage): void;

  hasPong(): boolean;
  clearPong(): void;
  getPong(): node_pb.Pong | undefined;
  setPong(value?: node_pb.Pong): void;

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
    evalFailed?: node_pb.EvalFailedMessage.AsObject,
    evalDone?: node_pb.EvalDoneMessage.AsObject,
    evalEvent?: node_pb.EvalEventMessage.AsObject,
    init?: WorkingInitMessage.AsObject,
    sharedProcessActive?: vscode_pb.SharedProcessActiveMessage.AsObject,
    pong?: node_pb.Pong.AsObject,
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    EVAL_FAILED = 13,
    EVAL_DONE = 14,
    EVAL_EVENT = 15,
    INIT = 16,
    SHARED_PROCESS_ACTIVE = 17,
    PONG = 18,
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

