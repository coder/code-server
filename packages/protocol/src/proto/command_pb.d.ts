// package: 
// file: command.proto

import * as jspb from "google-protobuf";

export class NewSessionMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getCommand(): string;
  setCommand(value: string): void;

  clearArgsList(): void;
  getArgsList(): Array<string>;
  setArgsList(value: Array<string>): void;
  addArgs(value: string, index?: number): string;

  getEnvMap(): jspb.Map<string, string>;
  clearEnvMap(): void;
  getCwd(): string;
  setCwd(value: string): void;

  hasTtyDimensions(): boolean;
  clearTtyDimensions(): void;
  getTtyDimensions(): TTYDimensions | undefined;
  setTtyDimensions(value?: TTYDimensions): void;

  getIsFork(): boolean;
  setIsFork(value: boolean): void;

  getIsBootstrapFork(): boolean;
  setIsBootstrapFork(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewSessionMessage.AsObject;
  static toObject(includeInstance: boolean, msg: NewSessionMessage): NewSessionMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewSessionMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewSessionMessage;
  static deserializeBinaryFromReader(message: NewSessionMessage, reader: jspb.BinaryReader): NewSessionMessage;
}

export namespace NewSessionMessage {
  export type AsObject = {
    id: number,
    command: string,
    argsList: Array<string>,
    envMap: Array<[string, string]>,
    cwd: string,
    ttyDimensions?: TTYDimensions.AsObject,
    isFork: boolean,
    isBootstrapFork: boolean,
  }
}

export class NewSessionFailureMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getReason(): NewSessionFailureMessage.Reason;
  setReason(value: NewSessionFailureMessage.Reason): void;

  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewSessionFailureMessage.AsObject;
  static toObject(includeInstance: boolean, msg: NewSessionFailureMessage): NewSessionFailureMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewSessionFailureMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewSessionFailureMessage;
  static deserializeBinaryFromReader(message: NewSessionFailureMessage, reader: jspb.BinaryReader): NewSessionFailureMessage;
}

export namespace NewSessionFailureMessage {
  export type AsObject = {
    id: number,
    reason: NewSessionFailureMessage.Reason,
    message: string,
  }

  export enum Reason {
    PROHIBITED = 0,
    RESOURCESHORTAGE = 1,
  }
}

export class SessionDoneMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getExitStatus(): number;
  setExitStatus(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SessionDoneMessage.AsObject;
  static toObject(includeInstance: boolean, msg: SessionDoneMessage): SessionDoneMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SessionDoneMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SessionDoneMessage;
  static deserializeBinaryFromReader(message: SessionDoneMessage, reader: jspb.BinaryReader): SessionDoneMessage;
}

export namespace SessionDoneMessage {
  export type AsObject = {
    id: number,
    exitStatus: number,
  }
}

export class IdentifySessionMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getPid(): number;
  setPid(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IdentifySessionMessage.AsObject;
  static toObject(includeInstance: boolean, msg: IdentifySessionMessage): IdentifySessionMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: IdentifySessionMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IdentifySessionMessage;
  static deserializeBinaryFromReader(message: IdentifySessionMessage, reader: jspb.BinaryReader): IdentifySessionMessage;
}

export namespace IdentifySessionMessage {
  export type AsObject = {
    id: number,
    pid: number,
  }
}

export class WriteToSessionMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): void;

  getSource(): WriteToSessionMessage.Source;
  setSource(value: WriteToSessionMessage.Source): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WriteToSessionMessage.AsObject;
  static toObject(includeInstance: boolean, msg: WriteToSessionMessage): WriteToSessionMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WriteToSessionMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WriteToSessionMessage;
  static deserializeBinaryFromReader(message: WriteToSessionMessage, reader: jspb.BinaryReader): WriteToSessionMessage;
}

export namespace WriteToSessionMessage {
  export type AsObject = {
    id: number,
    data: Uint8Array | string,
    source: WriteToSessionMessage.Source,
  }

  export enum Source {
    STDIN = 0,
    IPC = 1,
  }
}

export class ResizeSessionTTYMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  hasTtyDimensions(): boolean;
  clearTtyDimensions(): void;
  getTtyDimensions(): TTYDimensions | undefined;
  setTtyDimensions(value?: TTYDimensions): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResizeSessionTTYMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ResizeSessionTTYMessage): ResizeSessionTTYMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ResizeSessionTTYMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResizeSessionTTYMessage;
  static deserializeBinaryFromReader(message: ResizeSessionTTYMessage, reader: jspb.BinaryReader): ResizeSessionTTYMessage;
}

export namespace ResizeSessionTTYMessage {
  export type AsObject = {
    id: number,
    ttyDimensions?: TTYDimensions.AsObject,
  }
}

export class CloseSessionInputMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CloseSessionInputMessage.AsObject;
  static toObject(includeInstance: boolean, msg: CloseSessionInputMessage): CloseSessionInputMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CloseSessionInputMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CloseSessionInputMessage;
  static deserializeBinaryFromReader(message: CloseSessionInputMessage, reader: jspb.BinaryReader): CloseSessionInputMessage;
}

export namespace CloseSessionInputMessage {
  export type AsObject = {
    id: number,
  }
}

export class ShutdownSessionMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getSignal(): string;
  setSignal(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ShutdownSessionMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ShutdownSessionMessage): ShutdownSessionMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ShutdownSessionMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ShutdownSessionMessage;
  static deserializeBinaryFromReader(message: ShutdownSessionMessage, reader: jspb.BinaryReader): ShutdownSessionMessage;
}

export namespace ShutdownSessionMessage {
  export type AsObject = {
    id: number,
    signal: string,
  }
}

export class SessionOutputMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getSource(): SessionOutputMessage.Source;
  setSource(value: SessionOutputMessage.Source): void;

  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SessionOutputMessage.AsObject;
  static toObject(includeInstance: boolean, msg: SessionOutputMessage): SessionOutputMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SessionOutputMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SessionOutputMessage;
  static deserializeBinaryFromReader(message: SessionOutputMessage, reader: jspb.BinaryReader): SessionOutputMessage;
}

export namespace SessionOutputMessage {
  export type AsObject = {
    id: number,
    source: SessionOutputMessage.Source,
    data: Uint8Array | string,
  }

  export enum Source {
    STDOUT = 0,
    STDERR = 1,
    IPC = 2,
  }
}

export class TTYDimensions extends jspb.Message {
  getHeight(): number;
  setHeight(value: number): void;

  getWidth(): number;
  setWidth(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TTYDimensions.AsObject;
  static toObject(includeInstance: boolean, msg: TTYDimensions): TTYDimensions.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TTYDimensions, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TTYDimensions;
  static deserializeBinaryFromReader(message: TTYDimensions, reader: jspb.BinaryReader): TTYDimensions;
}

export namespace TTYDimensions {
  export type AsObject = {
    height: number,
    width: number,
  }
}

export class NewConnectionMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getPort(): number;
  setPort(value: number): void;

  getPath(): string;
  setPath(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewConnectionMessage.AsObject;
  static toObject(includeInstance: boolean, msg: NewConnectionMessage): NewConnectionMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewConnectionMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewConnectionMessage;
  static deserializeBinaryFromReader(message: NewConnectionMessage, reader: jspb.BinaryReader): NewConnectionMessage;
}

export namespace NewConnectionMessage {
  export type AsObject = {
    id: number,
    port: number,
    path: string,
  }
}

export class ConnectionEstablishedMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConnectionEstablishedMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ConnectionEstablishedMessage): ConnectionEstablishedMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ConnectionEstablishedMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConnectionEstablishedMessage;
  static deserializeBinaryFromReader(message: ConnectionEstablishedMessage, reader: jspb.BinaryReader): ConnectionEstablishedMessage;
}

export namespace ConnectionEstablishedMessage {
  export type AsObject = {
    id: number,
  }
}

export class NewConnectionFailureMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewConnectionFailureMessage.AsObject;
  static toObject(includeInstance: boolean, msg: NewConnectionFailureMessage): NewConnectionFailureMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewConnectionFailureMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewConnectionFailureMessage;
  static deserializeBinaryFromReader(message: NewConnectionFailureMessage, reader: jspb.BinaryReader): NewConnectionFailureMessage;
}

export namespace NewConnectionFailureMessage {
  export type AsObject = {
    id: number,
    message: string,
  }
}

export class ConnectionOutputMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConnectionOutputMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ConnectionOutputMessage): ConnectionOutputMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ConnectionOutputMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConnectionOutputMessage;
  static deserializeBinaryFromReader(message: ConnectionOutputMessage, reader: jspb.BinaryReader): ConnectionOutputMessage;
}

export namespace ConnectionOutputMessage {
  export type AsObject = {
    id: number,
    data: Uint8Array | string,
  }
}

export class ConnectionCloseMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConnectionCloseMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ConnectionCloseMessage): ConnectionCloseMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ConnectionCloseMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConnectionCloseMessage;
  static deserializeBinaryFromReader(message: ConnectionCloseMessage, reader: jspb.BinaryReader): ConnectionCloseMessage;
}

export namespace ConnectionCloseMessage {
  export type AsObject = {
    id: number,
  }
}

export class NewServerMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getPort(): number;
  setPort(value: number): void;

  getPath(): string;
  setPath(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewServerMessage.AsObject;
  static toObject(includeInstance: boolean, msg: NewServerMessage): NewServerMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewServerMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewServerMessage;
  static deserializeBinaryFromReader(message: NewServerMessage, reader: jspb.BinaryReader): NewServerMessage;
}

export namespace NewServerMessage {
  export type AsObject = {
    id: number,
    port: number,
    path: string,
  }
}

export class NewServerFailureMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewServerFailureMessage.AsObject;
  static toObject(includeInstance: boolean, msg: NewServerFailureMessage): NewServerFailureMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewServerFailureMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewServerFailureMessage;
  static deserializeBinaryFromReader(message: NewServerFailureMessage, reader: jspb.BinaryReader): NewServerFailureMessage;
}

export namespace NewServerFailureMessage {
  export type AsObject = {
    id: number,
    message: string,
  }
}

export class ServerEstablishedMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerEstablishedMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ServerEstablishedMessage): ServerEstablishedMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerEstablishedMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerEstablishedMessage;
  static deserializeBinaryFromReader(message: ServerEstablishedMessage, reader: jspb.BinaryReader): ServerEstablishedMessage;
}

export namespace ServerEstablishedMessage {
  export type AsObject = {
    id: number,
  }
}

export class ServerCloseMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getReason(): string;
  setReason(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerCloseMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ServerCloseMessage): ServerCloseMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerCloseMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerCloseMessage;
  static deserializeBinaryFromReader(message: ServerCloseMessage, reader: jspb.BinaryReader): ServerCloseMessage;
}

export namespace ServerCloseMessage {
  export type AsObject = {
    id: number,
    reason: string,
  }
}

export class ServerConnectionEstablishedMessage extends jspb.Message {
  getServerId(): number;
  setServerId(value: number): void;

  getConnectionId(): number;
  setConnectionId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerConnectionEstablishedMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ServerConnectionEstablishedMessage): ServerConnectionEstablishedMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerConnectionEstablishedMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerConnectionEstablishedMessage;
  static deserializeBinaryFromReader(message: ServerConnectionEstablishedMessage, reader: jspb.BinaryReader): ServerConnectionEstablishedMessage;
}

export namespace ServerConnectionEstablishedMessage {
  export type AsObject = {
    serverId: number,
    connectionId: number,
  }
}

