// package: 
// file: vscode.proto

import * as jspb from "google-protobuf";

export class SharedProcessActive extends jspb.Message {
  getSocketPath(): string;
  setSocketPath(value: string): void;

  getLogPath(): string;
  setLogPath(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SharedProcessActive.AsObject;
  static toObject(includeInstance: boolean, msg: SharedProcessActive): SharedProcessActive.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SharedProcessActive, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SharedProcessActive;
  static deserializeBinaryFromReader(message: SharedProcessActive, reader: jspb.BinaryReader): SharedProcessActive;
}

export namespace SharedProcessActive {
  export type AsObject = {
    socketPath: string,
    logPath: string,
  }
}

