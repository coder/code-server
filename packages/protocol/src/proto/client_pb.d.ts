// package: 
// file: client.proto

import * as jspb from "google-protobuf";
import * as command_pb from "./command_pb";
import * as node_pb from "./node_pb";
import * as vscode_pb from "./vscode_pb";

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

  hasNewConnection(): boolean;
  clearNewConnection(): void;
  getNewConnection(): command_pb.NewConnectionMessage | undefined;
  setNewConnection(value?: command_pb.NewConnectionMessage): void;

  hasConnectionOutput(): boolean;
  clearConnectionOutput(): void;
  getConnectionOutput(): command_pb.ConnectionOutputMessage | undefined;
  setConnectionOutput(value?: command_pb.ConnectionOutputMessage): void;

  hasConnectionClose(): boolean;
  clearConnectionClose(): void;
  getConnectionClose(): command_pb.ConnectionCloseMessage | undefined;
  setConnectionClose(value?: command_pb.ConnectionCloseMessage): void;

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
    newConnection?: command_pb.NewConnectionMessage.AsObject,
    connectionOutput?: command_pb.ConnectionOutputMessage.AsObject,
    connectionClose?: command_pb.ConnectionCloseMessage.AsObject,
    newEval?: node_pb.NewEvalMessage.AsObject,
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    NEW_SESSION = 1,
    SHUTDOWN_SESSION = 2,
    WRITE_TO_SESSION = 3,
    CLOSE_SESSION_INPUT = 4,
    RESIZE_SESSION_TTY = 5,
    NEW_CONNECTION = 6,
    CONNECTION_OUTPUT = 7,
    CONNECTION_CLOSE = 8,
    NEW_EVAL = 9,
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

  hasIdentifySession(): boolean;
  clearIdentifySession(): void;
  getIdentifySession(): command_pb.IdentifySessionMessage | undefined;
  setIdentifySession(value?: command_pb.IdentifySessionMessage): void;

  hasConnectionFailure(): boolean;
  clearConnectionFailure(): void;
  getConnectionFailure(): command_pb.NewConnectionFailureMessage | undefined;
  setConnectionFailure(value?: command_pb.NewConnectionFailureMessage): void;

  hasConnectionOutput(): boolean;
  clearConnectionOutput(): void;
  getConnectionOutput(): command_pb.ConnectionOutputMessage | undefined;
  setConnectionOutput(value?: command_pb.ConnectionOutputMessage): void;

  hasConnectionClose(): boolean;
  clearConnectionClose(): void;
  getConnectionClose(): command_pb.ConnectionCloseMessage | undefined;
  setConnectionClose(value?: command_pb.ConnectionCloseMessage): void;

  hasConnectionEstablished(): boolean;
  clearConnectionEstablished(): void;
  getConnectionEstablished(): command_pb.ConnectionEstablishedMessage | undefined;
  setConnectionEstablished(value?: command_pb.ConnectionEstablishedMessage): void;

  hasEvalFailed(): boolean;
  clearEvalFailed(): void;
  getEvalFailed(): node_pb.EvalFailedMessage | undefined;
  setEvalFailed(value?: node_pb.EvalFailedMessage): void;

  hasEvalDone(): boolean;
  clearEvalDone(): void;
  getEvalDone(): node_pb.EvalDoneMessage | undefined;
  setEvalDone(value?: node_pb.EvalDoneMessage): void;

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
    newSessionFailure?: command_pb.NewSessionFailureMessage.AsObject,
    sessionDone?: command_pb.SessionDoneMessage.AsObject,
    sessionOutput?: command_pb.SessionOutputMessage.AsObject,
    identifySession?: command_pb.IdentifySessionMessage.AsObject,
    connectionFailure?: command_pb.NewConnectionFailureMessage.AsObject,
    connectionOutput?: command_pb.ConnectionOutputMessage.AsObject,
    connectionClose?: command_pb.ConnectionCloseMessage.AsObject,
    connectionEstablished?: command_pb.ConnectionEstablishedMessage.AsObject,
    evalFailed?: node_pb.EvalFailedMessage.AsObject,
    evalDone?: node_pb.EvalDoneMessage.AsObject,
    init?: WorkingInitMessage.AsObject,
    sharedProcessActive?: vscode_pb.SharedProcessActiveMessage.AsObject,
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    NEW_SESSION_FAILURE = 1,
    SESSION_DONE = 2,
    SESSION_OUTPUT = 3,
    IDENTIFY_SESSION = 4,
    CONNECTION_FAILURE = 5,
    CONNECTION_OUTPUT = 6,
    CONNECTION_CLOSE = 7,
    CONNECTION_ESTABLISHED = 8,
    EVAL_FAILED = 9,
    EVAL_DONE = 10,
    INIT = 11,
    SHARED_PROCESS_ACTIVE = 12,
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
  }

  export enum OperatingSystem {
    WINDOWS = 0,
    LINUX = 1,
    MAC = 2,
  }
}

