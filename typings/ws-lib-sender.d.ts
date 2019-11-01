/**
 * `Sender` class which isn't exported with the default packages, and isn't
 * typed by the @types definition.
 */

declare module "ws/lib/sender" {
  import { Socket } from 'net';

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

  export default class Sender {
    static frame(data: Buffer, options?: FrameOptions): Buffer[];

    constructor(socket: Socket);
    close(code?: number, data?: string, mask?: boolean, cb?: Function): void;
    ping(data?: any, mask?: boolean, cb?: Function): void;
    pong(data?: any, mask?: boolean, cb?: Function): void;
    send(data: any, options: SendOptions, cb?: Function): void;
  }
}

