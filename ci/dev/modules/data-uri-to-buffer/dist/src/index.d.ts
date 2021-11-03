/**
 * Returns a `Buffer` instance from the given data URI `uri`.
 *
 * @param {String} uri Data URI to turn into a Buffer instance
 * @return {Buffer} Buffer instance from Data URI
 * @api public
 */
/// <reference types="node" />
declare function dataUriToBuffer(uri: string): dataUriToBuffer.MimeBuffer;
declare namespace dataUriToBuffer {
    interface MimeBuffer extends Buffer {
        type: string;
        typeFull: string;
        charset: string;
    }
}
export = dataUriToBuffer;
