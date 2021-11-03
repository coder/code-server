/// <reference types="node" />
import { Readable } from 'stream';
import { UrlWithStringQuery } from 'url';
/**
 * Async function that returns a `stream.Readable` instance to the
 * callback function that will output the contents of the given URI.
 *
 * For caching purposes, you can pass in a `stream` instance from a previous
 * `getUri()` call as a `cache: stream` option, and if the destination has
 * not changed since the last time the endpoint was retreived then the callback
 * will be invoked with an Error object with `code` set to "ENOTMODIFIED" and
 * `null` for the "stream" instance argument. In this case, you can skip
 * retreiving the file again and continue to use the previous payload.
 *
 * @param {String} uri URI to retrieve
 * @param {Object} opts optional "options" object
 * @param {Function} fn callback function
 * @api public
 */
declare function getUri(uri: string, fn: getUri.GetUriCallback): void;
declare function getUri(uri: string, opts: getUri.GetUriOptions, fn: getUri.GetUriCallback): void;
declare function getUri(uri: string, opts?: getUri.GetUriOptions): Promise<Readable>;
declare namespace getUri {
    interface GetUriOptions {
        cache?: Readable;
    }
    type GetUriCallback = (err?: Error | null, res?: Readable) => void;
    type GetUriProtocol = (parsed: UrlWithStringQuery, opts: getUri.GetUriOptions) => Promise<Readable>;
    const protocols: {
        [key: string]: getUri.GetUriProtocol;
    };
}
export = getUri;
