// package: 
// file: node.proto

import * as jspb from "google-protobuf";

export class Argument extends jspb.Message {
  hasError(): boolean;
  clearError(): void;
  getError(): Argument.ErrorValue | undefined;
  setError(value?: Argument.ErrorValue): void;

  hasBuffer(): boolean;
  clearBuffer(): void;
  getBuffer(): Argument.BufferValue | undefined;
  setBuffer(value?: Argument.BufferValue): void;

  hasObject(): boolean;
  clearObject(): void;
  getObject(): Argument.ObjectValue | undefined;
  setObject(value?: Argument.ObjectValue): void;

  hasArray(): boolean;
  clearArray(): void;
  getArray(): Argument.ArrayValue | undefined;
  setArray(value?: Argument.ArrayValue): void;

  hasProxy(): boolean;
  clearProxy(): void;
  getProxy(): Argument.ProxyValue | undefined;
  setProxy(value?: Argument.ProxyValue): void;

  hasFunction(): boolean;
  clearFunction(): void;
  getFunction(): Argument.FunctionValue | undefined;
  setFunction(value?: Argument.FunctionValue): void;

  hasNull(): boolean;
  clearNull(): void;
  getNull(): Argument.NullValue | undefined;
  setNull(value?: Argument.NullValue): void;

  hasUndefined(): boolean;
  clearUndefined(): void;
  getUndefined(): Argument.UndefinedValue | undefined;
  setUndefined(value?: Argument.UndefinedValue): void;

  hasNumber(): boolean;
  clearNumber(): void;
  getNumber(): number;
  setNumber(value: number): void;

  hasString(): boolean;
  clearString(): void;
  getString(): string;
  setString(value: string): void;

  hasBoolean(): boolean;
  clearBoolean(): void;
  getBoolean(): boolean;
  setBoolean(value: boolean): void;

  hasDate(): boolean;
  clearDate(): void;
  getDate(): Argument.DateValue | undefined;
  setDate(value?: Argument.DateValue): void;

  getMsgCase(): Argument.MsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Argument.AsObject;
  static toObject(includeInstance: boolean, msg: Argument): Argument.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Argument, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Argument;
  static deserializeBinaryFromReader(message: Argument, reader: jspb.BinaryReader): Argument;
}

export namespace Argument {
  export type AsObject = {
    error?: Argument.ErrorValue.AsObject,
    buffer?: Argument.BufferValue.AsObject,
    object?: Argument.ObjectValue.AsObject,
    array?: Argument.ArrayValue.AsObject,
    proxy?: Argument.ProxyValue.AsObject,
    pb_function?: Argument.FunctionValue.AsObject,
    pb_null?: Argument.NullValue.AsObject,
    undefined?: Argument.UndefinedValue.AsObject,
    number: number,
    string: string,
    pb_boolean: boolean,
    date?: Argument.DateValue.AsObject,
  }

  export class ErrorValue extends jspb.Message {
    getMessage(): string;
    setMessage(value: string): void;

    getStack(): string;
    setStack(value: string): void;

    getCode(): string;
    setCode(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ErrorValue.AsObject;
    static toObject(includeInstance: boolean, msg: ErrorValue): ErrorValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ErrorValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ErrorValue;
    static deserializeBinaryFromReader(message: ErrorValue, reader: jspb.BinaryReader): ErrorValue;
  }

  export namespace ErrorValue {
    export type AsObject = {
      message: string,
      stack: string,
      code: string,
    }
  }

  export class BufferValue extends jspb.Message {
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BufferValue.AsObject;
    static toObject(includeInstance: boolean, msg: BufferValue): BufferValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BufferValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BufferValue;
    static deserializeBinaryFromReader(message: BufferValue, reader: jspb.BinaryReader): BufferValue;
  }

  export namespace BufferValue {
    export type AsObject = {
      data: Uint8Array | string,
    }
  }

  export class ObjectValue extends jspb.Message {
    getDataMap(): jspb.Map<string, Argument>;
    clearDataMap(): void;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ObjectValue.AsObject;
    static toObject(includeInstance: boolean, msg: ObjectValue): ObjectValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ObjectValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ObjectValue;
    static deserializeBinaryFromReader(message: ObjectValue, reader: jspb.BinaryReader): ObjectValue;
  }

  export namespace ObjectValue {
    export type AsObject = {
      dataMap: Array<[string, Argument.AsObject]>,
    }
  }

  export class ArrayValue extends jspb.Message {
    clearDataList(): void;
    getDataList(): Array<Argument>;
    setDataList(value: Array<Argument>): void;
    addData(value?: Argument, index?: number): Argument;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ArrayValue.AsObject;
    static toObject(includeInstance: boolean, msg: ArrayValue): ArrayValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ArrayValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ArrayValue;
    static deserializeBinaryFromReader(message: ArrayValue, reader: jspb.BinaryReader): ArrayValue;
  }

  export namespace ArrayValue {
    export type AsObject = {
      dataList: Array<Argument.AsObject>,
    }
  }

  export class ProxyValue extends jspb.Message {
    getId(): number;
    setId(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ProxyValue.AsObject;
    static toObject(includeInstance: boolean, msg: ProxyValue): ProxyValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ProxyValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ProxyValue;
    static deserializeBinaryFromReader(message: ProxyValue, reader: jspb.BinaryReader): ProxyValue;
  }

  export namespace ProxyValue {
    export type AsObject = {
      id: number,
    }
  }

  export class FunctionValue extends jspb.Message {
    getId(): number;
    setId(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FunctionValue.AsObject;
    static toObject(includeInstance: boolean, msg: FunctionValue): FunctionValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FunctionValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FunctionValue;
    static deserializeBinaryFromReader(message: FunctionValue, reader: jspb.BinaryReader): FunctionValue;
  }

  export namespace FunctionValue {
    export type AsObject = {
      id: number,
    }
  }

  export class NullValue extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NullValue.AsObject;
    static toObject(includeInstance: boolean, msg: NullValue): NullValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NullValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NullValue;
    static deserializeBinaryFromReader(message: NullValue, reader: jspb.BinaryReader): NullValue;
  }

  export namespace NullValue {
    export type AsObject = {
    }
  }

  export class UndefinedValue extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UndefinedValue.AsObject;
    static toObject(includeInstance: boolean, msg: UndefinedValue): UndefinedValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UndefinedValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UndefinedValue;
    static deserializeBinaryFromReader(message: UndefinedValue, reader: jspb.BinaryReader): UndefinedValue;
  }

  export namespace UndefinedValue {
    export type AsObject = {
    }
  }

  export class DateValue extends jspb.Message {
    getDate(): string;
    setDate(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DateValue.AsObject;
    static toObject(includeInstance: boolean, msg: DateValue): DateValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DateValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DateValue;
    static deserializeBinaryFromReader(message: DateValue, reader: jspb.BinaryReader): DateValue;
  }

  export namespace DateValue {
    export type AsObject = {
      date: string,
    }
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    ERROR = 1,
    BUFFER = 2,
    OBJECT = 3,
    ARRAY = 4,
    PROXY = 5,
    FUNCTION = 6,
    NULL = 7,
    UNDEFINED = 8,
    NUMBER = 9,
    STRING = 10,
    BOOLEAN = 11,
    DATE = 12,
  }
}

export class Method extends jspb.Message {
  hasNamedProxy(): boolean;
  clearNamedProxy(): void;
  getNamedProxy(): Method.Named | undefined;
  setNamedProxy(value?: Method.Named): void;

  hasNumberedProxy(): boolean;
  clearNumberedProxy(): void;
  getNumberedProxy(): Method.Numbered | undefined;
  setNumberedProxy(value?: Method.Numbered): void;

  getMsgCase(): Method.MsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Method.AsObject;
  static toObject(includeInstance: boolean, msg: Method): Method.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Method, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Method;
  static deserializeBinaryFromReader(message: Method, reader: jspb.BinaryReader): Method;
}

export namespace Method {
  export type AsObject = {
    namedProxy?: Method.Named.AsObject,
    numberedProxy?: Method.Numbered.AsObject,
  }

  export class Named extends jspb.Message {
    getId(): number;
    setId(value: number): void;

    getModule(): Module;
    setModule(value: Module): void;

    getMethod(): string;
    setMethod(value: string): void;

    clearArgsList(): void;
    getArgsList(): Array<Argument>;
    setArgsList(value: Array<Argument>): void;
    addArgs(value?: Argument, index?: number): Argument;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Named.AsObject;
    static toObject(includeInstance: boolean, msg: Named): Named.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Named, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Named;
    static deserializeBinaryFromReader(message: Named, reader: jspb.BinaryReader): Named;
  }

  export namespace Named {
    export type AsObject = {
      id: number,
      module: Module,
      method: string,
      argsList: Array<Argument.AsObject>,
    }
  }

  export class Numbered extends jspb.Message {
    getId(): number;
    setId(value: number): void;

    getProxyId(): number;
    setProxyId(value: number): void;

    getMethod(): string;
    setMethod(value: string): void;

    clearArgsList(): void;
    getArgsList(): Array<Argument>;
    setArgsList(value: Array<Argument>): void;
    addArgs(value?: Argument, index?: number): Argument;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Numbered.AsObject;
    static toObject(includeInstance: boolean, msg: Numbered): Numbered.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Numbered, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Numbered;
    static deserializeBinaryFromReader(message: Numbered, reader: jspb.BinaryReader): Numbered;
  }

  export namespace Numbered {
    export type AsObject = {
      id: number,
      proxyId: number,
      method: string,
      argsList: Array<Argument.AsObject>,
    }
  }

  export class Fail extends jspb.Message {
    getId(): number;
    setId(value: number): void;

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): Argument | undefined;
    setResponse(value?: Argument): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fail.AsObject;
    static toObject(includeInstance: boolean, msg: Fail): Fail.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fail, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fail;
    static deserializeBinaryFromReader(message: Fail, reader: jspb.BinaryReader): Fail;
  }

  export namespace Fail {
    export type AsObject = {
      id: number,
      response?: Argument.AsObject,
    }
  }

  export class Success extends jspb.Message {
    getId(): number;
    setId(value: number): void;

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): Argument | undefined;
    setResponse(value?: Argument): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Success.AsObject;
    static toObject(includeInstance: boolean, msg: Success): Success.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Success, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Success;
    static deserializeBinaryFromReader(message: Success, reader: jspb.BinaryReader): Success;
  }

  export namespace Success {
    export type AsObject = {
      id: number,
      response?: Argument.AsObject,
    }
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    NAMED_PROXY = 1,
    NUMBERED_PROXY = 2,
  }
}

export class Callback extends jspb.Message {
  hasNamedCallback(): boolean;
  clearNamedCallback(): void;
  getNamedCallback(): Callback.Named | undefined;
  setNamedCallback(value?: Callback.Named): void;

  hasNumberedCallback(): boolean;
  clearNumberedCallback(): void;
  getNumberedCallback(): Callback.Numbered | undefined;
  setNumberedCallback(value?: Callback.Numbered): void;

  getMsgCase(): Callback.MsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Callback.AsObject;
  static toObject(includeInstance: boolean, msg: Callback): Callback.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Callback, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Callback;
  static deserializeBinaryFromReader(message: Callback, reader: jspb.BinaryReader): Callback;
}

export namespace Callback {
  export type AsObject = {
    namedCallback?: Callback.Named.AsObject,
    numberedCallback?: Callback.Numbered.AsObject,
  }

  export class Named extends jspb.Message {
    getModule(): Module;
    setModule(value: Module): void;

    getCallbackId(): number;
    setCallbackId(value: number): void;

    clearArgsList(): void;
    getArgsList(): Array<Argument>;
    setArgsList(value: Array<Argument>): void;
    addArgs(value?: Argument, index?: number): Argument;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Named.AsObject;
    static toObject(includeInstance: boolean, msg: Named): Named.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Named, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Named;
    static deserializeBinaryFromReader(message: Named, reader: jspb.BinaryReader): Named;
  }

  export namespace Named {
    export type AsObject = {
      module: Module,
      callbackId: number,
      argsList: Array<Argument.AsObject>,
    }
  }

  export class Numbered extends jspb.Message {
    getProxyId(): number;
    setProxyId(value: number): void;

    getCallbackId(): number;
    setCallbackId(value: number): void;

    clearArgsList(): void;
    getArgsList(): Array<Argument>;
    setArgsList(value: Array<Argument>): void;
    addArgs(value?: Argument, index?: number): Argument;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Numbered.AsObject;
    static toObject(includeInstance: boolean, msg: Numbered): Numbered.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Numbered, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Numbered;
    static deserializeBinaryFromReader(message: Numbered, reader: jspb.BinaryReader): Numbered;
  }

  export namespace Numbered {
    export type AsObject = {
      proxyId: number,
      callbackId: number,
      argsList: Array<Argument.AsObject>,
    }
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    NAMED_CALLBACK = 1,
    NUMBERED_CALLBACK = 2,
  }
}

export class Event extends jspb.Message {
  hasNamedEvent(): boolean;
  clearNamedEvent(): void;
  getNamedEvent(): Event.Named | undefined;
  setNamedEvent(value?: Event.Named): void;

  hasNumberedEvent(): boolean;
  clearNumberedEvent(): void;
  getNumberedEvent(): Event.Numbered | undefined;
  setNumberedEvent(value?: Event.Numbered): void;

  getMsgCase(): Event.MsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Event.AsObject;
  static toObject(includeInstance: boolean, msg: Event): Event.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Event, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Event;
  static deserializeBinaryFromReader(message: Event, reader: jspb.BinaryReader): Event;
}

export namespace Event {
  export type AsObject = {
    namedEvent?: Event.Named.AsObject,
    numberedEvent?: Event.Numbered.AsObject,
  }

  export class Named extends jspb.Message {
    getModule(): Module;
    setModule(value: Module): void;

    getEvent(): string;
    setEvent(value: string): void;

    clearArgsList(): void;
    getArgsList(): Array<Argument>;
    setArgsList(value: Array<Argument>): void;
    addArgs(value?: Argument, index?: number): Argument;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Named.AsObject;
    static toObject(includeInstance: boolean, msg: Named): Named.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Named, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Named;
    static deserializeBinaryFromReader(message: Named, reader: jspb.BinaryReader): Named;
  }

  export namespace Named {
    export type AsObject = {
      module: Module,
      event: string,
      argsList: Array<Argument.AsObject>,
    }
  }

  export class Numbered extends jspb.Message {
    getProxyId(): number;
    setProxyId(value: number): void;

    getEvent(): string;
    setEvent(value: string): void;

    clearArgsList(): void;
    getArgsList(): Array<Argument>;
    setArgsList(value: Array<Argument>): void;
    addArgs(value?: Argument, index?: number): Argument;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Numbered.AsObject;
    static toObject(includeInstance: boolean, msg: Numbered): Numbered.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Numbered, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Numbered;
    static deserializeBinaryFromReader(message: Numbered, reader: jspb.BinaryReader): Numbered;
  }

  export namespace Numbered {
    export type AsObject = {
      proxyId: number,
      event: string,
      argsList: Array<Argument.AsObject>,
    }
  }

  export enum MsgCase {
    MSG_NOT_SET = 0,
    NAMED_EVENT = 1,
    NUMBERED_EVENT = 2,
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

export enum Module {
  CHILDPROCESS = 0,
  FS = 1,
  NET = 2,
  NODEPTY = 3,
  SPDLOG = 4,
  TRASH = 5,
}

