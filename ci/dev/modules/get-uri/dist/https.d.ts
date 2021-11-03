/// <reference types="node" />
import { Readable } from 'stream';
import { UrlWithStringQuery } from 'url';
import { HttpOptions } from './http';
/**
 * Returns a Readable stream from an "https:" URI.
 */
export default function get(parsed: UrlWithStringQuery, opts: HttpOptions): Promise<Readable>;
