// package: 
// file: node.proto

import * as jspb from "google-protobuf";

export class NewEvalMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getFunction(): string;
  setFunction(value: string): void;

  clearArgsList(): void;
  getArgsList(): Array<string>;
  setArgsList(value: Array<string>): void;
  addArgs(value: string, index?: number): string;

  getTimeout(): number;
  setTimeout(value: number): void;

  getActive(): boolean;
  setActive(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewEvalMessage.AsObject;
  static toObject(includeInstance: boolean, msg: NewEvalMessage): NewEvalMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewEvalMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewEvalMessage;
  static deserializeBinaryFromReader(message: NewEvalMessage, reader: jspb.BinaryReader): NewEvalMessage;
}

export namespace NewEvalMessage {
  export type AsObject = {
    id: number,
    pb_function: string,
    argsList: Array<string>,
    timeout: number,
    active: boolean,
  }
}

export class EvalEventMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getEvent(): string;
  setEvent(value: string): void;

  clearArgsList(): void;
  getArgsList(): Array<string>;
  setArgsList(value: Array<string>): void;
  addArgs(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EvalEventMessage.AsObject;
  static toObject(includeInstance: boolean, msg: EvalEventMessage): EvalEventMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EvalEventMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EvalEventMessage;
  static deserializeBinaryFromReader(message: EvalEventMessage, reader: jspb.BinaryReader): EvalEventMessage;
}

export namespace EvalEventMessage {
  export type AsObject = {
    id: number,
    event: string,
    argsList: Array<string>,
  }
}

export class EvalFailedMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getResponse(): string;
  setResponse(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EvalFailedMessage.AsObject;
  static toObject(includeInstance: boolean, msg: EvalFailedMessage): EvalFailedMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EvalFailedMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EvalFailedMessage;
  static deserializeBinaryFromReader(message: EvalFailedMessage, reader: jspb.BinaryReader): EvalFailedMessage;
}

export namespace EvalFailedMessage {
  export type AsObject = {
    id: number,
    response: string,
  }
}

export class EvalDoneMessage extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getResponse(): string;
  setResponse(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EvalDoneMessage.AsObject;
  static toObject(includeInstance: boolean, msg: EvalDoneMessage): EvalDoneMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EvalDoneMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EvalDoneMessage;
  static deserializeBinaryFromReader(message: EvalDoneMessage, reader: jspb.BinaryReader): EvalDoneMessage;
}

export namespace EvalDoneMessage {
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

