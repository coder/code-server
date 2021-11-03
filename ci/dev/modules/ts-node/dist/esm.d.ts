/// <reference types="node" />
import { RegisterOptions } from './index';
export declare function registerAndCreateEsmHooks(opts?: RegisterOptions): {
    resolve: (specifier: string, context: {
        parentURL: string;
    }, defaultResolve: any) => Promise<{
        url: string;
    }>;
    getFormat: (url: string, context: {}, defaultGetFormat: any) => Promise<{
        format: "builtin" | "commonjs" | "dynamic" | "json" | "module" | "wasm";
    }>;
    transformSource: (source: string | Buffer, context: {
        url: string;
        format: "builtin" | "commonjs" | "dynamic" | "json" | "module" | "wasm";
    }, defaultTransformSource: any) => Promise<{
        source: string | Buffer;
    }>;
};
