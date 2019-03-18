// package: 
// file: node.proto

import * as jspb from "google-protobuf";

export class NamedProxyMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getModule(): string;
  setModule(value: string): void;

  getMethod(): string;
  setMethod(value: string): void;

  clearArgsList(): void;
  getArgsList(): Array<string>;
  setArgsList(value: Array<string>): void;
  addArgs(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NamedProxyMessage.AsObject;
  static toObject(includeInstance: boolean, msg: NamedProxyMessage): NamedProxyMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NamedProxyMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NamedProxyMessage;
  static deserializeBinaryFromReader(message: NamedProxyMessage, reader: jspb.BinaryReader): NamedProxyMessage;
}

export namespace NamedProxyMessage {
  export type AsObject = {
    id: number,
    module: string,
    method: string,
    argsList: Array<string>,
  }
}

export class NumberedProxyMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getProxyId(): number;
  setProxyId(value: number): void;

  getMethod(): string;
  setMethod(value: string): void;

  clearArgsList(): void;
  getArgsList(): Array<string>;
  setArgsList(value: Array<string>): void;
  addArgs(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NumberedProxyMessage.AsObject;
  static toObject(includeInstance: boolean, msg: NumberedProxyMessage): NumberedProxyMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NumberedProxyMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NumberedProxyMessage;
  static deserializeBinaryFromReader(message: NumberedProxyMessage, reader: jspb.BinaryReader): NumberedProxyMessage;
}

export namespace NumberedProxyMessage {
  export type AsObject = {
    id: number,
    proxyId: number,
    method: string,
    argsList: Array<string>,
  }
}

export class MethodMessage extends jspb.Message {
  hasNamedProxy(): boolean;
  clearNamedProxy(): void;
  getNamedProxy(): NamedProxyMessage | undefined;
  setNamedProxy(value?: NamedProxyMessage): void;

  hasNumberedProxy(): boolean;
  clearNumberedProxy(): void;
  getNumberedProxy(): NumberedProxyMessage | undefined;
  setNumberedProxy(value?: NumberedProxyMessage): void;

  getMsgCase(): MethodMessage.MsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MethodMessage.AsObject;
  static toObject(includeInstance: boolean, msg: MethodMessage): MethodMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MethodMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MethodMessage;
  static deserializeBinaryFromReader(message: MethodMessage, reader: jspb.BinaryReader): MethodMessage;
}

export namespace MethodMessage {
  export type AsObject = {
    namedProxy?: NamedProxyMessage.AsObject,
    numberedProxy?: NumberedProxyMessage.AsObject,
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    NAMED_PROXY = 1,
    NUMBERED_PROXY = 2,
  }
}

export class CallbackMessage extends jspb.Message {
  getCallbackId(): number;
  setCallbackId(value: number): void;

  getProxyId(): number;
  setProxyId(value: number): void;

  clearArgsList(): void;
  getArgsList(): Array<string>;
  setArgsList(value: Array<string>): void;
  addArgs(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CallbackMessage.AsObject;
  static toObject(includeInstance: boolean, msg: CallbackMessage): CallbackMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CallbackMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CallbackMessage;
  static deserializeBinaryFromReader(message: CallbackMessage, reader: jspb.BinaryReader): CallbackMessage;
}

export namespace CallbackMessage {
  export type AsObject = {
    callbackId: number,
    proxyId: number,
    argsList: Array<string>,
  }
}

export class FailMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getResponse(): string;
  setResponse(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FailMessage.AsObject;
  static toObject(includeInstance: boolean, msg: FailMessage): FailMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FailMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FailMessage;
  static deserializeBinaryFromReader(message: FailMessage, reader: jspb.BinaryReader): FailMessage;
}

export namespace FailMessage {
  export type AsObject = {
    id: number,
    response: string,
  }
}

export class SuccessMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getResponse(): string;
  setResponse(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SuccessMessage.AsObject;
  static toObject(includeInstance: boolean, msg: SuccessMessage): SuccessMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SuccessMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SuccessMessage;
  static deserializeBinaryFromReader(message: SuccessMessage, reader: jspb.BinaryReader): SuccessMessage;
}

export namespace SuccessMessage {
  export type AsObject = {
    id: number,
    response: string,
  }
}

export class Ping extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Ping.AsObject;
  static toObject(includeInstance: boolean, msg: Ping): Ping.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Ping, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Ping;
  static deserializeBinaryFromReader(message: Ping, reader: jspb.BinaryReader): Ping;
}

export namespace Ping {
  export type AsObject = {
  }
}

export class Pong extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Pong.AsObject;
  static toObject(includeInstance: boolean, msg: Pong): Pong.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Pong, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Pong;
  static deserializeBinaryFromReader(message: Pong, reader: jspb.BinaryReader): Pong;
}

export namespace Pong {
  export type AsObject = {
  }
}

