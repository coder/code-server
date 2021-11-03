/// <reference types="node" />
import { GMT } from './index';
import { LookupAddress, LookupOptions } from 'dns';
export declare function dnsLookup(host: string, opts: LookupOptions): Promise<string | LookupAddress[]>;
export declare function isGMT(v: any): v is GMT;
