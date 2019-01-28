// package: 
// file: vscode.proto

import * as jspb from "google-protobuf";

export class SharedProcessActiveMessage extends jspb.Message {
  getSocketPath(): string;
  setSocketPath(value: string): void;

  getLogPath(): string;
  setLogPath(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SharedProcessActiveMessage.AsObject;
  static toObject(includeInstance: boolean, msg: SharedProcessActiveMessage): SharedProcessActiveMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SharedProcessActiveMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SharedProcessActiveMessage;
  static deserializeBinaryFromReader(message: SharedProcessActiveMessage, reader: jspb.BinaryReader): SharedProcessActiveMessage;
}

export namespace SharedProcessActiveMessage {
  export type AsObject = {
    socketPath: string,
    logPath: string,
  }
}

