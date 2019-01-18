// package: 
// file: vscode.proto

import * as jspb from "google-protobuf";

export class SharedProcessInitMessage extends jspb.Message {
  getWindowId(): number;
  setWindowId(value: number): void;

  getLogDirectory(): string;
  setLogDirectory(value: string): void;

  getLogLevel(): number;
  setLogLevel(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SharedProcessInitMessage.AsObject;
  static toObject(includeInstance: boolean, msg: SharedProcessInitMessage): SharedProcessInitMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SharedProcessInitMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SharedProcessInitMessage;
  static deserializeBinaryFromReader(message: SharedProcessInitMessage, reader: jspb.BinaryReader): SharedProcessInitMessage;
}

export namespace SharedProcessInitMessage {
  export type AsObject = {
    windowId: number,
    logDirectory: string,
    logLevel: number,
  }
}

