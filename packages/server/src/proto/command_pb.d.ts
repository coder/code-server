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
  hasTtyDimensions(): boolean;
  clearTtyDimensions(): void;
  getTtyDimensions(): TTYDimensions | undefined;
  setTtyDimensions(value?: TTYDimensions): void;

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
    ttyDimensions?: TTYDimensions.AsObject,
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
  }
}

export class SessionOutputMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getFd(): SessionOutputMessage.FD;
  setFd(value: SessionOutputMessage.FD): void;

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
    fd: SessionOutputMessage.FD,
    data: Uint8Array | string,
  }

  export enum FD {
    STDOUT = 0,
    STDERR = 1,
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

