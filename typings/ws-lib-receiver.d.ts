/**
 * `Receiver` class which isn't exported with the default packages, and isn't
 * typed by the @types definition.
 */

declare module "ws/lib/receiver" {
  import { Writable } from 'stream';

  export type BINARY_TYPES = 'nodebuffer' | 'arraybuffer' | 'fragments';

  export default class Receiver extends Writable {
    constructor(binaryType: BINARY_TYPES);
  }
}
