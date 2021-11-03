/// <reference types="node" />
import http from 'http';
import https from 'https';
import { Readable } from 'stream';
import { UrlWithStringQuery } from 'url';
import { GetUriOptions } from '.';
declare type HttpOrHttpsModule = typeof http | typeof https;
export interface HttpReadableProps {
    date?: number;
    parsed?: UrlWithStringQuery;
    redirects?: HttpReadable[];
}
export interface HttpReadable extends Readable, HttpReadableProps {
}
export interface HttpIncomingMessage extends http.IncomingMessage, HttpReadableProps {
}
export interface HttpOptions extends GetUriOptions, https.RequestOptions {
    cache?: HttpReadable;
    http?: HttpOrHttpsModule;
    redirects?: HttpReadable[];
    maxRedirects?: number;
}
/**
 * Returns a Readable stream from an "http:" URI.
 */
export default function get(parsed: UrlWithStringQuery, opts: HttpOptions): Promise<Readable>;
export {};
