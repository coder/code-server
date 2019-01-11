// package: 
// file: client.proto

import * as jspb from "google-protobuf";
import * as command_pb from "./command_pb";
import * as node_pb from "./node_pb";

export class ClientMessage extends jspb.Message {
  hasNewSession(): boolean;
  clearNewSession(): void;
  getNewSession(): command_pb.NewSessionMessage | undefined;
  setNewSession(value?: command_pb.NewSessionMessage): void;

  hasShutdownSession(): boolean;
  clearShutdownSession(): void;
  getShutdownSession(): command_pb.ShutdownSessionMessage | undefined;
  setShutdownSession(value?: command_pb.ShutdownSessionMessage): void;

  hasWriteToSession(): boolean;
  clearWriteToSession(): void;
  getWriteToSession(): command_pb.WriteToSessionMessage | undefined;
  setWriteToSession(value?: command_pb.WriteToSessionMessage): void;

  hasCloseSessionInput(): boolean;
  clearCloseSessionInput(): void;
  getCloseSessionInput(): command_pb.CloseSessionInputMessage | undefined;
  setCloseSessionInput(value?: command_pb.CloseSessionInputMessage): void;

  hasResizeSessionTty(): boolean;
  clearResizeSessionTty(): void;
  getResizeSessionTty(): command_pb.ResizeSessionTTYMessage | undefined;
  setResizeSessionTty(value?: command_pb.ResizeSessionTTYMessage): void;

  hasNewEval(): boolean;
  clearNewEval(): void;
  getNewEval(): node_pb.NewEvalMessage | undefined;
  setNewEval(value?: node_pb.NewEvalMessage): void;

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
    newSession?: command_pb.NewSessionMessage.AsObject,
    shutdownSession?: command_pb.ShutdownSessionMessage.AsObject,
    writeToSession?: command_pb.WriteToSessionMessage.AsObject,
    closeSessionInput?: command_pb.CloseSessionInputMessage.AsObject,
    resizeSessionTty?: command_pb.ResizeSessionTTYMessage.AsObject,
    newEval?: node_pb.NewEvalMessage.AsObject,
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    NEW_SESSION = 1,
    SHUTDOWN_SESSION = 2,
    WRITE_TO_SESSION = 3,
    CLOSE_SESSION_INPUT = 4,
    RESIZE_SESSION_TTY = 5,
    NEW_EVAL = 6,
  }
}

export class ServerMessage extends jspb.Message {
  hasNewSessionFailure(): boolean;
  clearNewSessionFailure(): void;
  getNewSessionFailure(): command_pb.NewSessionFailureMessage | undefined;
  setNewSessionFailure(value?: command_pb.NewSessionFailureMessage): void;

  hasSessionDone(): boolean;
  clearSessionDone(): void;
  getSessionDone(): command_pb.SessionDoneMessage | undefined;
  setSessionDone(value?: command_pb.SessionDoneMessage): void;

  hasSessionOutput(): boolean;
  clearSessionOutput(): void;
  getSessionOutput(): command_pb.SessionOutputMessage | undefined;
  setSessionOutput(value?: command_pb.SessionOutputMessage): void;

  hasEvalFailed(): boolean;
  clearEvalFailed(): void;
  getEvalFailed(): node_pb.EvalFailedMessage | undefined;
  setEvalFailed(value?: node_pb.EvalFailedMessage): void;

  hasEvalDone(): boolean;
  clearEvalDone(): void;
  getEvalDone(): node_pb.EvalDoneMessage | undefined;
  setEvalDone(value?: node_pb.EvalDoneMessage): void;

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
    newSessionFailure?: command_pb.NewSessionFailureMessage.AsObject,
    sessionDone?: command_pb.SessionDoneMessage.AsObject,
    sessionOutput?: command_pb.SessionOutputMessage.AsObject,
    evalFailed?: node_pb.EvalFailedMessage.AsObject,
    evalDone?: node_pb.EvalDoneMessage.AsObject,
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    NEW_SESSION_FAILURE = 1,
    SESSION_DONE = 2,
    SESSION_OUTPUT = 3,
    EVAL_FAILED = 4,
    EVAL_DONE = 5,
  }
}

