/**
 * Custom typing for the `Sender` and `Receiver` classes which aren't typed in
 * the @types/ws module.
 */

declare module "ws" {
  import { Writable } from 'stream';
  import { Socket } from 'net';

  /*** Sender class & types ***/
  export interface FrameOptions {
    opcode?: number;
    readOnly?: boolean;
    fin?: boolean;
    mask?: boolean;
    rsv1?: boolean;
  }

  export interface SendOptions {
    compress?: boolean;
    binary?: boolean;
    fin?: boolean;
    mask?: boolean;
  }

  export class Sender {
    static frame(data: Buffer, options?: FrameOptions): Buffer[];

    constructor(socket: Socket);
    close(code?: number, data?: string, mask?: boolean, cb?: Function): void;
    ping(data?: any, mask?: boolean, cb?: Function): void;
    pong(data?: any, mask?: boolean, cb?: Function): void;
    send(data: any, options: SendOptions, cb?: Function): void;
  }

  /*** Receiver class & types ***/
  export type BINARY_TYPES = 'nodebuffer' | 'arraybuffer' | 'fragments';

  export class Receiver extends Writable {
    constructor(binaryType: BINARY_TYPES);
  }
}
