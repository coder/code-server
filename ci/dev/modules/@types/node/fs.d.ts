declare module 'fs' {
    import * as stream from 'stream';
    import EventEmitter = require('events');
    import { URL } from 'url';
    import * as promises from 'fs/promises';

    export { promises };
    /**
     * Valid types for path values in "fs".
     */
    export type PathLike = string | Buffer | URL;

    export type NoParamCallback = (err: NodeJS.ErrnoException | null) => void;

    export type BufferEncodingOption = 'buffer' | { encoding: 'buffer' };

    export interface BaseEncodingOptions {
        encoding?: BufferEncoding | null | undefined;
    }

    export type OpenMode = number | string;

    export type Mode = number | string;

    export interface StatsBase<T> {
        isFile(): boolean;
        isDirectory(): boolean;
        isBlockDevice(): boolean;
        isCharacterDevice(): boolean;
        isSymbolicLink(): boolean;
        isFIFO(): boolean;
        isSocket(): boolean;

        dev: T;
        ino: T;
        mode: T;
        nlink: T;
        uid: T;
        gid: T;
        rdev: T;
        size: T;
        blksize: T;
        blocks: T;
        atimeMs: T;
        mtimeMs: T;
        ctimeMs: T;
        birthtimeMs: T;
        atime: Date;
        mtime: Date;
        ctime: Date;
        birthtime: Date;
    }

    export interface Stats extends StatsBase<number> {
    }

    export class Stats {
    }

    export class Dirent {
        isFile(): boolean;
        isDirectory(): boolean;
        isBlockDevice(): boolean;
        isCharacterDevice(): boolean;
        isSymbolicLink(): boolean;
        isFIFO(): boolean;
        isSocket(): boolean;
        name: string;
    }

    /**
     * A class representing a directory stream.
     */
    export class Dir {
        readonly path: string;

        /**
         * Asynchronously iterates over the directory via `readdir(3)` until all entries have been read.
         */
        [Symbol.asyncIterator](): AsyncIterableIterator<Dirent>;

        /**
         * Asynchronously close the directory's underlying resource handle.
         * Subsequent reads will result in errors.
         */
        close(): Promise<void>;
        close(cb: NoParamCallback): void;

        /**
         * Synchronously close the directory's underlying resource handle.
         * Subsequent reads will result in errors.
         */
        closeSync(): void;

        /**
         * Asynchronously read the next directory entry via `readdir(3)` as an `Dirent`.
         * After the read is completed, a value is returned that will be resolved with an `Dirent`, or `null` if there are no more directory entries to read.
         * Directory entries returned by this function are in no particular order as provided by the operating system's underlying directory mechanisms.
         */
        read(): Promise<Dirent | null>;
        read(cb: (err: NodeJS.ErrnoException | null, dirEnt: Dirent | null) => void): void;

        /**
         * Synchronously read the next directory entry via `readdir(3)` as a `Dirent`.
         * If there are no more directory entries to read, null will be returned.
         * Directory entries returned by this function are in no particular order as provided by the operating system's underlying directory mechanisms.
         */
        readSync(): Dirent | null;
    }

    export interface FSWatcher extends EventEmitter {
        close(): void;

        /**
         * events.EventEmitter
         *   1. change
         *   2. error
         */
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        addListener(event: "error", listener: (error: Error) => void): this;
        addListener(event: "close", listener: () => void): this;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        on(event: "error", listener: (error: Error) => void): this;
        on(event: "close", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        once(event: "error", listener: (error: Error) => void): this;
        once(event: "close", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        prependListener(event: "error", listener: (error: Error) => void): this;
        prependListener(event: "close", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        prependOnceListener(event: "error", listener: (error: Error) => void): this;
        prependOnceListener(event: "close", listener: () => void): this;
    }

    export class ReadStream extends stream.Readable {
        close(): void;
        bytesRead: number;
        path: string | Buffer;
        pending: boolean;

        /**
         * events.EventEmitter
         *   1. open
         *   2. close
         *   3. ready
         */
        addListener(event: "close", listener: () => void): this;
        addListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        addListener(event: "end", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "open", listener: (fd: number) => void): this;
        addListener(event: "pause", listener: () => void): this;
        addListener(event: "readable", listener: () => void): this;
        addListener(event: "ready", listener: () => void): this;
        addListener(event: "resume", listener: () => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        on(event: "close", listener: () => void): this;
        on(event: "data", listener: (chunk: Buffer | string) => void): this;
        on(event: "end", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "open", listener: (fd: number) => void): this;
        on(event: "pause", listener: () => void): this;
        on(event: "readable", listener: () => void): this;
        on(event: "ready", listener: () => void): this;
        on(event: "resume", listener: () => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "close", listener: () => void): this;
        once(event: "data", listener: (chunk: Buffer | string) => void): this;
        once(event: "end", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "open", listener: (fd: number) => void): this;
        once(event: "pause", listener: () => void): this;
        once(event: "readable", listener: () => void): this;
        once(event: "ready", listener: () => void): this;
        once(event: "resume", listener: () => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        prependListener(event: "end", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "open", listener: (fd: number) => void): this;
        prependListener(event: "pause", listener: () => void): this;
        prependListener(event: "readable", listener: () => void): this;
        prependListener(event: "ready", listener: () => void): this;
        prependListener(event: "resume", listener: () => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        prependOnceListener(event: "end", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "open", listener: (fd: number) => void): this;
        prependOnceListener(event: "pause", listener: () => void): this;
        prependOnceListener(event: "readable", listener: () => void): this;
        prependOnceListener(event: "ready", listener: () => void): this;
        prependOnceListener(event: "resume", listener: () => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    export class WriteStream extends stream.Writable {
        close(): void;
        bytesWritten: number;
        path: string | Buffer;
        pending: boolean;

        /**
         * events.EventEmitter
         *   1. open
         *   2. close
         *   3. ready
         */
        addListener(event: "close", listener: () => void): this;
        addListener(event: "drain", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "finish", listener: () => void): this;
        addListener(event: "open", listener: (fd: number) => void): this;
        addListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        addListener(event: "ready", listener: () => void): this;
        addListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        on(event: "close", listener: () => void): this;
        on(event: "drain", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "finish", listener: () => void): this;
        on(event: "open", listener: (fd: number) => void): this;
        on(event: "pipe", listener: (src: stream.Readable) => void): this;
        on(event: "ready", listener: () => void): this;
        on(event: "unpipe", listener: (src: stream.Readable) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "close", listener: () => void): this;
        once(event: "drain", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "finish", listener: () => void): this;
        once(event: "open", listener: (fd: number) => void): this;
        once(event: "pipe", listener: (src: stream.Readable) => void): this;
        once(event: "ready", listener: () => void): this;
        once(event: "unpipe", listener: (src: stream.Readable) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "drain", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "finish", listener: () => void): this;
        prependListener(event: "open", listener: (fd: number) => void): this;
        prependListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        prependListener(event: "ready", listener: () => void): this;
        prependListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "drain", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "finish", listener: () => void): this;
        prependOnceListener(event: "open", listener: (fd: number) => void): this;
        prependOnceListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: "ready", listener: () => void): this;
        prependOnceListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    /**
     * Asynchronous rename(2) - Change the name or location of a file or directory.
     * @param oldPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * @param newPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function rename(oldPath: PathLike, newPath: PathLike, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace rename {
        /**
         * Asynchronous rename(2) - Change the name or location of a file or directory.
         * @param oldPath A path to a file. If a URL is provided, it must use the `file:` protocol.
         * URL support is _experimental_.
         * @param newPath A path to a file. If a URL is provided, it must use the `file:` protocol.
         * URL support is _experimental_.
         */
        function __promisify__(oldPath: PathLike, newPath: PathLike): Promise<void>;
    }

    /**
     * Synchronous rename(2) - Change the name or location of a file or directory.
     * @param oldPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * @param newPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function renameSync(oldPath: PathLike, newPath: PathLike): void;

    /**
     * Asynchronous truncate(2) - Truncate a file to a specified length.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param len If not specified, defaults to `0`.
     */
    export function truncate(path: PathLike, len: number | undefined | null, callback: NoParamCallback): void;

    /**
     * Asynchronous truncate(2) - Truncate a file to a specified length.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function truncate(path: PathLike, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace truncate {
        /**
         * Asynchronous truncate(2) - Truncate a file to a specified length.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param len If not specified, defaults to `0`.
         */
        function __promisify__(path: PathLike, len?: number | null): Promise<void>;
    }

    /**
     * Synchronous truncate(2) - Truncate a file to a specified length.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param len If not specified, defaults to `0`.
     */
    export function truncateSync(path: PathLike, len?: number | null): void;

    /**
     * Asynchronous ftruncate(2) - Truncate a file to a specified length.
     * @param fd A file descriptor.
     * @param len If not specified, defaults to `0`.
     */
    export function ftruncate(fd: number, len: number | undefined | null, callback: NoParamCallback): void;

    /**
     * Asynchronous ftruncate(2) - Truncate a file to a specified length.
     * @param fd A file descriptor.
     */
    export function ftruncate(fd: number, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace ftruncate {
        /**
         * Asynchronous ftruncate(2) - Truncate a file to a specified length.
         * @param fd A file descriptor.
         * @param len If not specified, defaults to `0`.
         */
        function __promisify__(fd: number, len?: number | null): Promise<void>;
    }

    /**
     * Synchronous ftruncate(2) - Truncate a file to a specified length.
     * @param fd A file descriptor.
     * @param len If not specified, defaults to `0`.
     */
    export function ftruncateSync(fd: number, len?: number | null): void;

    /**
     * Asynchronous chown(2) - Change ownership of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function chown(path: PathLike, uid: number, gid: number, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace chown {
        /**
         * Asynchronous chown(2) - Change ownership of a file.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         */
        function __promisify__(path: PathLike, uid: number, gid: number): Promise<void>;
    }

    /**
     * Synchronous chown(2) - Change ownership of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function chownSync(path: PathLike, uid: number, gid: number): void;

    /**
     * Asynchronous fchown(2) - Change ownership of a file.
     * @param fd A file descriptor.
     */
    export function fchown(fd: number, uid: number, gid: number, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fchown {
        /**
         * Asynchronous fchown(2) - Change ownership of a file.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number, uid: number, gid: number): Promise<void>;
    }

    /**
     * Synchronous fchown(2) - Change ownership of a file.
     * @param fd A file descriptor.
     */
    export function fchownSync(fd: number, uid: number, gid: number): void;

    /**
     * Asynchronous lchown(2) - Change ownership of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function lchown(path: PathLike, uid: number, gid: number, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace lchown {
        /**
         * Asynchronous lchown(2) - Change ownership of a file. Does not dereference symbolic links.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         */
        function __promisify__(path: PathLike, uid: number, gid: number): Promise<void>;
    }

    /**
     * Synchronous lchown(2) - Change ownership of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function lchownSync(path: PathLike, uid: number, gid: number): void;

    /**
     * Changes the access and modification times of a file in the same way as `fs.utimes()`,
     * with the difference that if the path refers to a symbolic link, then the link is not
     * dereferenced: instead, the timestamps of the symbolic link itself are changed.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function lutimes(path: PathLike, atime: string | number | Date, mtime: string | number | Date, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace lutimes {
        /**
         * Changes the access and modification times of a file in the same way as `fsPromises.utimes()`,
         * with the difference that if the path refers to a symbolic link, then the link is not
         * dereferenced: instead, the timestamps of the symbolic link itself are changed.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param atime The last access time. If a string is provided, it will be coerced to number.
         * @param mtime The last modified time. If a string is provided, it will be coerced to number.
         */
        function __promisify__(path: PathLike, atime: string | number | Date, mtime: string | number | Date): Promise<void>;
    }

    /**
     * Change the file system timestamps of the symbolic link referenced by `path`. Returns `undefined`,
     * or throws an exception when parameters are incorrect or the operation fails.
     * This is the synchronous version of `fs.lutimes()`.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function lutimesSync(path: PathLike, atime: string | number | Date, mtime: string | number | Date): void;

    /**
     * Asynchronous chmod(2) - Change permissions of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function chmod(path: PathLike, mode: Mode, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace chmod {
        /**
         * Asynchronous chmod(2) - Change permissions of a file.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
         */
        function __promisify__(path: PathLike, mode: Mode): Promise<void>;
    }

    /**
     * Synchronous chmod(2) - Change permissions of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function chmodSync(path: PathLike, mode: Mode): void;

    /**
     * Asynchronous fchmod(2) - Change permissions of a file.
     * @param fd A file descriptor.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function fchmod(fd: number, mode: Mode, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fchmod {
        /**
         * Asynchronous fchmod(2) - Change permissions of a file.
         * @param fd A file descriptor.
         * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
         */
        function __promisify__(fd: number, mode: Mode): Promise<void>;
    }

    /**
     * Synchronous fchmod(2) - Change permissions of a file.
     * @param fd A file descriptor.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function fchmodSync(fd: number, mode: Mode): void;

    /**
     * Asynchronous lchmod(2) - Change permissions of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function lchmod(path: PathLike, mode: Mode, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace lchmod {
        /**
         * Asynchronous lchmod(2) - Change permissions of a file. Does not dereference symbolic links.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
         */
        function __promisify__(path: PathLike, mode: Mode): Promise<void>;
    }

    /**
     * Synchronous lchmod(2) - Change permissions of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function lchmodSync(path: PathLike, mode: Mode): void;

    /**
     * Asynchronous stat(2) - Get file status.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function stat(path: PathLike, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function stat(path: PathLike, options: StatOptions & { bigint?: false | undefined } | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function stat(path: PathLike, options: StatOptions & { bigint: true }, callback: (err: NodeJS.ErrnoException | null, stats: BigIntStats) => void): void;
    export function stat(path: PathLike, options: StatOptions | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats | BigIntStats) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace stat {
        /**
         * Asynchronous stat(2) - Get file status.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         */
        function __promisify__(path: PathLike, options?: StatOptions & { bigint?: false | undefined }): Promise<Stats>;
        function __promisify__(path: PathLike, options: StatOptions & { bigint: true }): Promise<BigIntStats>;
        function __promisify__(path: PathLike, options?: StatOptions): Promise<Stats | BigIntStats>;
    }

    /**
     * Synchronous stat(2) - Get file status.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function statSync(path: PathLike, options?: StatOptions & { bigint?: false | undefined }): Stats;
    export function statSync(path: PathLike, options: StatOptions & { bigint: true }): BigIntStats;
    export function statSync(path: PathLike, options?: StatOptions): Stats | BigIntStats;

    /**
     * Asynchronous fstat(2) - Get file status.
     * @param fd A file descriptor.
     */
    export function fstat(fd: number, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function fstat(fd: number, options: StatOptions & { bigint?: false | undefined } | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function fstat(fd: number, options: StatOptions & { bigint: true }, callback: (err: NodeJS.ErrnoException | null, stats: BigIntStats) => void): void;
    export function fstat(fd: number, options: StatOptions | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats | BigIntStats) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fstat {
        /**
         * Asynchronous fstat(2) - Get file status.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number, options?: StatOptions & { bigint?: false | undefined }): Promise<Stats>;
        function __promisify__(fd: number, options: StatOptions & { bigint: true }): Promise<BigIntStats>;
        function __promisify__(fd: number, options?: StatOptions): Promise<Stats | BigIntStats>;
    }

    /**
     * Synchronous fstat(2) - Get file status.
     * @param fd A file descriptor.
     */
    export function fstatSync(fd: number, options?: StatOptions & { bigint?: false | undefined }): Stats;
    export function fstatSync(fd: number, options: StatOptions & { bigint: true }): BigIntStats;
    export function fstatSync(fd: number, options?: StatOptions): Stats | BigIntStats;

    /**
     * Asynchronous lstat(2) - Get file status. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function lstat(path: PathLike, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function lstat(path: PathLike, options: StatOptions & { bigint?: false | undefined } | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function lstat(path: PathLike, options: StatOptions & { bigint: true }, callback: (err: NodeJS.ErrnoException | null, stats: BigIntStats) => void): void;
    export function lstat(path: PathLike, options: StatOptions | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats | BigIntStats) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace lstat {
        /**
         * Asynchronous lstat(2) - Get file status. Does not dereference symbolic links.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         */
        function __promisify__(path: PathLike, options?: StatOptions & { bigint?: false | undefined }): Promise<Stats>;
        function __promisify__(path: PathLike, options: StatOptions & { bigint: true }): Promise<BigIntStats>;
        function __promisify__(path: PathLike, options?: StatOptions): Promise<Stats | BigIntStats>;
    }

    /**
     * Synchronous lstat(2) - Get file status. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function lstatSync(path: PathLike, options?: StatOptions & { bigint?: false | undefined }): Stats;
    export function lstatSync(path: PathLike, options: StatOptions & { bigint: true }): BigIntStats;
    export function lstatSync(path: PathLike, options?: StatOptions): Stats | BigIntStats;

    /**
     * Asynchronous link(2) - Create a new link (also known as a hard link) to an existing file.
     * @param existingPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param newPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function link(existingPath: PathLike, newPath: PathLike, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace link {
        /**
         * Asynchronous link(2) - Create a new link (also known as a hard link) to an existing file.
         * @param existingPath A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param newPath A path to a file. If a URL is provided, it must use the `file:` protocol.
         */
        function __promisify__(existingPath: PathLike, newPath: PathLike): Promise<void>;
    }

    /**
     * Synchronous link(2) - Create a new link (also known as a hard link) to an existing file.
     * @param existingPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param newPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function linkSync(existingPath: PathLike, newPath: PathLike): void;

    /**
     * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
     * @param target A path to an existing file. If a URL is provided, it must use the `file:` protocol.
     * @param path A path to the new symlink. If a URL is provided, it must use the `file:` protocol.
     * @param type May be set to `'dir'`, `'file'`, or `'junction'` (default is `'file'`) and is only available on Windows (ignored on other platforms).
     * When using `'junction'`, the `target` argument will automatically be normalized to an absolute path.
     */
    export function symlink(target: PathLike, path: PathLike, type: symlink.Type | undefined | null, callback: NoParamCallback): void;

    /**
     * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
     * @param target A path to an existing file. If a URL is provided, it must use the `file:` protocol.
     * @param path A path to the new symlink. If a URL is provided, it must use the `file:` protocol.
     */
    export function symlink(target: PathLike, path: PathLike, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace symlink {
        /**
         * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
         * @param target A path to an existing file. If a URL is provided, it must use the `file:` protocol.
         * @param path A path to the new symlink. If a URL is provided, it must use the `file:` protocol.
         * @param type May be set to `'dir'`, `'file'`, or `'junction'` (default is `'file'`) and is only available on Windows (ignored on other platforms).
         * When using `'junction'`, the `target` argument will automatically be normalized to an absolute path.
         */
        function __promisify__(target: PathLike, path: PathLike, type?: string | null): Promise<void>;

        type Type = "dir" | "file" | "junction";
    }

    /**
     * Synchronous symlink(2) - Create a new symbolic link to an existing file.
     * @param target A path to an existing file. If a URL is provided, it must use the `file:` protocol.
     * @param path A path to the new symlink. If a URL is provided, it must use the `file:` protocol.
     * @param type May be set to `'dir'`, `'file'`, or `'junction'` (default is `'file'`) and is only available on Windows (ignored on other platforms).
     * When using `'junction'`, the `target` argument will automatically be normalized to an absolute path.
     */
    export function symlinkSync(target: PathLike, path: PathLike, type?: symlink.Type | null): void;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readlink(
        path: PathLike,
        options: BaseEncodingOptions | BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, linkString: string) => void
    ): void;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readlink(path: PathLike, options: BufferEncodingOption, callback: (err: NodeJS.ErrnoException | null, linkString: Buffer) => void): void;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readlink(path: PathLike, options: BaseEncodingOptions | string | undefined | null, callback: (err: NodeJS.ErrnoException | null, linkString: string | Buffer) => void): void;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function readlink(path: PathLike, callback: (err: NodeJS.ErrnoException | null, linkString: string) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace readlink {
        /**
         * Asynchronous readlink(2) - read value of a symbolic link.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string>;

        /**
         * Asynchronous readlink(2) - read value of a symbolic link.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(path: PathLike, options: BufferEncodingOption): Promise<Buffer>;

        /**
         * Asynchronous readlink(2) - read value of a symbolic link.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions | string | null): Promise<string | Buffer>;
    }

    /**
     * Synchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readlinkSync(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): string;

    /**
     * Synchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readlinkSync(path: PathLike, options: BufferEncodingOption): Buffer;

    /**
     * Synchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readlinkSync(path: PathLike, options?: BaseEncodingOptions | string | null): string | Buffer;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function realpath(
        path: PathLike,
        options: BaseEncodingOptions | BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, resolvedPath: string) => void
    ): void;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function realpath(path: PathLike, options: BufferEncodingOption, callback: (err: NodeJS.ErrnoException | null, resolvedPath: Buffer) => void): void;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function realpath(path: PathLike, options: BaseEncodingOptions | string | undefined | null, callback: (err: NodeJS.ErrnoException | null, resolvedPath: string | Buffer) => void): void;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function realpath(path: PathLike, callback: (err: NodeJS.ErrnoException | null, resolvedPath: string) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace realpath {
        /**
         * Asynchronous realpath(3) - return the canonicalized absolute pathname.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string>;

        /**
         * Asynchronous realpath(3) - return the canonicalized absolute pathname.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(path: PathLike, options: BufferEncodingOption): Promise<Buffer>;

        /**
         * Asynchronous realpath(3) - return the canonicalized absolute pathname.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions | string | null): Promise<string | Buffer>;

        function native(
            path: PathLike,
            options: BaseEncodingOptions | BufferEncoding | undefined | null,
            callback: (err: NodeJS.ErrnoException | null, resolvedPath: string) => void
        ): void;
        function native(path: PathLike, options: BufferEncodingOption, callback: (err: NodeJS.ErrnoException | null, resolvedPath: Buffer) => void): void;
        function native(path: PathLike, options: BaseEncodingOptions | string | undefined | null, callback: (err: NodeJS.ErrnoException | null, resolvedPath: string | Buffer) => void): void;
        function native(path: PathLike, callback: (err: NodeJS.ErrnoException | null, resolvedPath: string) => void): void;
    }

    /**
     * Synchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function realpathSync(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): string;

    /**
     * Synchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function realpathSync(path: PathLike, options: BufferEncodingOption): Buffer;

    /**
     * Synchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function realpathSync(path: PathLike, options?: BaseEncodingOptions | string | null): string | Buffer;

    export namespace realpathSync {
        function native(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): string;
        function native(path: PathLike, options: BufferEncodingOption): Buffer;
        function native(path: PathLike, options?: BaseEncodingOptions | string | null): string | Buffer;
    }

    /**
     * Asynchronous unlink(2) - delete a name and possibly the file it refers to.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function unlink(path: PathLike, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace unlink {
        /**
         * Asynchronous unlink(2) - delete a name and possibly the file it refers to.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         */
        function __promisify__(path: PathLike): Promise<void>;
    }

    /**
     * Synchronous unlink(2) - delete a name and possibly the file it refers to.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function unlinkSync(path: PathLike): void;

    export interface RmDirOptions {
        /**
         * If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or
         * `EPERM` error is encountered, Node.js will retry the operation with a linear
         * backoff wait of `retryDelay` ms longer on each try. This option represents the
         * number of retries. This option is ignored if the `recursive` option is not
         * `true`.
         * @default 0
         */
        maxRetries?: number | undefined;
        /**
         * @deprecated since v14.14.0 In future versions of Node.js,
         * `fs.rmdir(path, { recursive: true })` will throw on nonexistent
         * paths, or when given a file as a target.
         * Use `fs.rm(path, { recursive: true, force: true })` instead.
         *
         * If `true`, perform a recursive directory removal. In
         * recursive mode, errors are not reported if `path` does not exist, and
         * operations are retried on failure.
         * @default false
         */
        recursive?: boolean | undefined;
        /**
         * The amount of time in milliseconds to wait between retries.
         * This option is ignored if the `recursive` option is not `true`.
         * @default 100
         */
        retryDelay?: number | undefined;
    }

    /**
     * Asynchronous rmdir(2) - delete a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function rmdir(path: PathLike, callback: NoParamCallback): void;
    export function rmdir(path: PathLike, options: RmDirOptions, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace rmdir {
        /**
         * Asynchronous rmdir(2) - delete a directory.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         */
        function __promisify__(path: PathLike, options?: RmDirOptions): Promise<void>;
    }

    /**
     * Synchronous rmdir(2) - delete a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function rmdirSync(path: PathLike, options?: RmDirOptions): void;

    export interface RmOptions {
        /**
         * When `true`, exceptions will be ignored if `path` does not exist.
         * @default false
         */
        force?: boolean | undefined;
        /**
         * If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or
         * `EPERM` error is encountered, Node.js will retry the operation with a linear
         * backoff wait of `retryDelay` ms longer on each try. This option represents the
         * number of retries. This option is ignored if the `recursive` option is not
         * `true`.
         * @default 0
         */
        maxRetries?: number | undefined;
        /**
         * If `true`, perform a recursive directory removal. In
         * recursive mode, errors are not reported if `path` does not exist, and
         * operations are retried on failure.
         * @default false
         */
        recursive?: boolean | undefined;
        /**
         * The amount of time in milliseconds to wait between retries.
         * This option is ignored if the `recursive` option is not `true`.
         * @default 100
         */
        retryDelay?: number | undefined;
    }

    /**
     * Asynchronously removes files and directories (modeled on the standard POSIX `rm` utility).
     */
    export function rm(path: PathLike, callback: NoParamCallback): void;
    export function rm(path: PathLike, options: RmOptions, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace rm {
        /**
         * Asynchronously removes files and directories (modeled on the standard POSIX `rm` utility).
         */
        function __promisify__(path: PathLike, options?: RmOptions): Promise<void>;
    }

    /**
     * Synchronously removes files and directories (modeled on the standard POSIX `rm` utility).
     */
    export function rmSync(path: PathLike, options?: RmOptions): void;

    export interface MakeDirectoryOptions {
        /**
         * Indicates whether parent folders should be created.
         * If a folder was created, the path to the first created folder will be returned.
         * @default false
         */
        recursive?: boolean | undefined;
        /**
         * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
         * @default 0o777
         */
        mode?: Mode | undefined;
    }

    /**
     * Asynchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
     */
    export function mkdir(path: PathLike, options: MakeDirectoryOptions & { recursive: true }, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): void;

    /**
     * Asynchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
     */
    export function mkdir(path: PathLike, options: Mode | (MakeDirectoryOptions & { recursive?: false | undefined; }) | null | undefined, callback: NoParamCallback): void;

    /**
     * Asynchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
     */
    export function mkdir(path: PathLike, options: Mode | MakeDirectoryOptions | null | undefined, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): void;

    /**
     * Asynchronous mkdir(2) - create a directory with a mode of `0o777`.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function mkdir(path: PathLike, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace mkdir {
        /**
         * Asynchronous mkdir(2) - create a directory.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
         * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
         */
        function __promisify__(path: PathLike, options: MakeDirectoryOptions & { recursive: true; }): Promise<string | undefined>;

        /**
         * Asynchronous mkdir(2) - create a directory.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
         * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
         */
        function __promisify__(path: PathLike, options?: Mode | (MakeDirectoryOptions & { recursive?: false | undefined; }) | null): Promise<void>;

        /**
         * Asynchronous mkdir(2) - create a directory.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
         * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
         */
        function __promisify__(path: PathLike, options?: Mode | MakeDirectoryOptions | null): Promise<string | undefined>;
    }

    /**
     * Synchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
     */
    export function mkdirSync(path: PathLike, options: MakeDirectoryOptions & { recursive: true; }): string | undefined;

    /**
     * Synchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
     */
    export function mkdirSync(path: PathLike, options?: Mode | (MakeDirectoryOptions & { recursive?: false | undefined; }) | null): void;

    /**
     * Synchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
     */
    export function mkdirSync(path: PathLike, options?: Mode | MakeDirectoryOptions | null): string | undefined;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function mkdtemp(prefix: string, options: BaseEncodingOptions | BufferEncoding | undefined | null, callback: (err: NodeJS.ErrnoException | null, folder: string) => void): void;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function mkdtemp(prefix: string, options: "buffer" | { encoding: "buffer" }, callback: (err: NodeJS.ErrnoException | null, folder: Buffer) => void): void;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function mkdtemp(prefix: string, options: BaseEncodingOptions | string | undefined | null, callback: (err: NodeJS.ErrnoException | null, folder: string | Buffer) => void): void;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     */
    export function mkdtemp(prefix: string, callback: (err: NodeJS.ErrnoException | null, folder: string) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace mkdtemp {
        /**
         * Asynchronously creates a unique temporary directory.
         * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(prefix: string, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string>;

        /**
         * Asynchronously creates a unique temporary directory.
         * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(prefix: string, options: BufferEncodingOption): Promise<Buffer>;

        /**
         * Asynchronously creates a unique temporary directory.
         * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(prefix: string, options?: BaseEncodingOptions | string | null): Promise<string | Buffer>;
    }

    /**
     * Synchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function mkdtempSync(prefix: string, options?: BaseEncodingOptions | BufferEncoding | null): string;

    /**
     * Synchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function mkdtempSync(prefix: string, options: BufferEncodingOption): Buffer;

    /**
     * Synchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function mkdtempSync(prefix: string, options?: BaseEncodingOptions | string | null): string | Buffer;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readdir(
        path: PathLike,
        options: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, files: string[]) => void,
    ): void;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readdir(
        path: PathLike,
        options: { encoding: "buffer"; withFileTypes?: false | undefined } | "buffer",
        callback: (err: NodeJS.ErrnoException | null, files: Buffer[]) => void
    ): void;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readdir(
        path: PathLike,
        options: BaseEncodingOptions & { withFileTypes?: false | undefined } | BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, files: string[] | Buffer[]) => void,
    ): void;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function readdir(path: PathLike, callback: (err: NodeJS.ErrnoException | null, files: string[]) => void): void;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options If called with `withFileTypes: true` the result data will be an array of Dirent.
     */
    export function readdir(path: PathLike, options: BaseEncodingOptions & { withFileTypes: true }, callback: (err: NodeJS.ErrnoException | null, files: Dirent[]) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace readdir {
        /**
         * Asynchronous readdir(3) - read a directory.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(path: PathLike, options?: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | null): Promise<string[]>;

        /**
         * Asynchronous readdir(3) - read a directory.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(path: PathLike, options: "buffer" | { encoding: "buffer"; withFileTypes?: false | undefined }): Promise<Buffer[]>;

        /**
         * Asynchronous readdir(3) - read a directory.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions & { withFileTypes?: false | undefined } | BufferEncoding | null): Promise<string[] | Buffer[]>;

        /**
         * Asynchronous readdir(3) - read a directory.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param options If called with `withFileTypes: true` the result data will be an array of Dirent
         */
        function __promisify__(path: PathLike, options: BaseEncodingOptions & { withFileTypes: true }): Promise<Dirent[]>;
    }

    /**
     * Synchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readdirSync(path: PathLike, options?: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | null): string[];

    /**
     * Synchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readdirSync(path: PathLike, options: { encoding: "buffer"; withFileTypes?: false | undefined } | "buffer"): Buffer[];

    /**
     * Synchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    export function readdirSync(path: PathLike, options?: BaseEncodingOptions & { withFileTypes?: false | undefined } | BufferEncoding | null): string[] | Buffer[];

    /**
     * Synchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options If called with `withFileTypes: true` the result data will be an array of Dirent.
     */
    export function readdirSync(path: PathLike, options: BaseEncodingOptions & { withFileTypes: true }): Dirent[];

    /**
     * Asynchronous close(2) - close a file descriptor.
     * @param fd A file descriptor.
     */
    export function close(fd: number, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace close {
        /**
         * Asynchronous close(2) - close a file descriptor.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number): Promise<void>;
    }

    /**
     * Synchronous close(2) - close a file descriptor.
     * @param fd A file descriptor.
     */
    export function closeSync(fd: number): void;

    /**
     * Asynchronous open(2) - open and possibly create a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer. If not supplied, defaults to `0o666`.
     */
    export function open(path: PathLike, flags: OpenMode, mode: Mode | undefined | null, callback: (err: NodeJS.ErrnoException | null, fd: number) => void): void;

    /**
     * Asynchronous open(2) - open and possibly create a file. If the file is created, its mode will be `0o666`.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    export function open(path: PathLike, flags: OpenMode, callback: (err: NodeJS.ErrnoException | null, fd: number) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace open {
        /**
         * Asynchronous open(2) - open and possibly create a file.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param mode A file mode. If a string is passed, it is parsed as an octal integer. If not supplied, defaults to `0o666`.
         */
        function __promisify__(path: PathLike, flags: OpenMode, mode?: Mode | null): Promise<number>;
    }

    /**
     * Synchronous open(2) - open and possibly create a file, returning a file descriptor..
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer. If not supplied, defaults to `0o666`.
     */
    export function openSync(path: PathLike, flags: OpenMode, mode?: Mode | null): number;

    /**
     * Asynchronously change file timestamps of the file referenced by the supplied path.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function utimes(path: PathLike, atime: string | number | Date, mtime: string | number | Date, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace utimes {
        /**
         * Asynchronously change file timestamps of the file referenced by the supplied path.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * @param atime The last access time. If a string is provided, it will be coerced to number.
         * @param mtime The last modified time. If a string is provided, it will be coerced to number.
         */
        function __promisify__(path: PathLike, atime: string | number | Date, mtime: string | number | Date): Promise<void>;
    }

    /**
     * Synchronously change file timestamps of the file referenced by the supplied path.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function utimesSync(path: PathLike, atime: string | number | Date, mtime: string | number | Date): void;

    /**
     * Asynchronously change file timestamps of the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function futimes(fd: number, atime: string | number | Date, mtime: string | number | Date, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace futimes {
        /**
         * Asynchronously change file timestamps of the file referenced by the supplied file descriptor.
         * @param fd A file descriptor.
         * @param atime The last access time. If a string is provided, it will be coerced to number.
         * @param mtime The last modified time. If a string is provided, it will be coerced to number.
         */
        function __promisify__(fd: number, atime: string | number | Date, mtime: string | number | Date): Promise<void>;
    }

    /**
     * Synchronously change file timestamps of the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function futimesSync(fd: number, atime: string | number | Date, mtime: string | number | Date): void;

    /**
     * Asynchronous fsync(2) - synchronize a file's in-core state with the underlying storage device.
     * @param fd A file descriptor.
     */
    export function fsync(fd: number, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fsync {
        /**
         * Asynchronous fsync(2) - synchronize a file's in-core state with the underlying storage device.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number): Promise<void>;
    }

    /**
     * Synchronous fsync(2) - synchronize a file's in-core state with the underlying storage device.
     * @param fd A file descriptor.
     */
    export function fsyncSync(fd: number): void;

    /**
     * Asynchronously writes `buffer` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
     * @param length The number of bytes to write. If not supplied, defaults to `buffer.length - offset`.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     */
    export function write<TBuffer extends NodeJS.ArrayBufferView>(
        fd: number,
        buffer: TBuffer,
        offset: number | undefined | null,
        length: number | undefined | null,
        position: number | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, written: number, buffer: TBuffer) => void,
    ): void;

    /**
     * Asynchronously writes `buffer` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
     * @param length The number of bytes to write. If not supplied, defaults to `buffer.length - offset`.
     */
    export function write<TBuffer extends NodeJS.ArrayBufferView>(
        fd: number,
        buffer: TBuffer,
        offset: number | undefined | null,
        length: number | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, written: number, buffer: TBuffer) => void,
    ): void;

    /**
     * Asynchronously writes `buffer` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
     */
    export function write<TBuffer extends NodeJS.ArrayBufferView>(
        fd: number,
        buffer: TBuffer,
        offset: number | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, written: number, buffer: TBuffer) => void
    ): void;

    /**
     * Asynchronously writes `buffer` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     */
    export function write<TBuffer extends NodeJS.ArrayBufferView>(fd: number, buffer: TBuffer, callback: (err: NodeJS.ErrnoException | null, written: number, buffer: TBuffer) => void): void;

    /**
     * Asynchronously writes `string` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param string A string to write.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     * @param encoding The expected string encoding.
     */
    export function write(
        fd: number,
        string: string,
        position: number | undefined | null,
        encoding: BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, written: number, str: string) => void,
    ): void;

    /**
     * Asynchronously writes `string` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param string A string to write.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     */
    export function write(fd: number, string: string, position: number | undefined | null, callback: (err: NodeJS.ErrnoException | null, written: number, str: string) => void): void;

    /**
     * Asynchronously writes `string` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param string A string to write.
     */
    export function write(fd: number, string: string, callback: (err: NodeJS.ErrnoException | null, written: number, str: string) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace write {
        /**
         * Asynchronously writes `buffer` to the file referenced by the supplied file descriptor.
         * @param fd A file descriptor.
         * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
         * @param length The number of bytes to write. If not supplied, defaults to `buffer.length - offset`.
         * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
         */
        function __promisify__<TBuffer extends NodeJS.ArrayBufferView>(
            fd: number,
            buffer?: TBuffer,
            offset?: number,
            length?: number,
            position?: number | null,
        ): Promise<{ bytesWritten: number, buffer: TBuffer }>;

        /**
         * Asynchronously writes `string` to the file referenced by the supplied file descriptor.
         * @param fd A file descriptor.
         * @param string A string to write.
         * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
         * @param encoding The expected string encoding.
         */
        function __promisify__(fd: number, string: string, position?: number | null, encoding?: BufferEncoding | null): Promise<{ bytesWritten: number, buffer: string }>;
    }

    /**
     * Synchronously writes `buffer` to the file referenced by the supplied file descriptor, returning the number of bytes written.
     * @param fd A file descriptor.
     * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
     * @param length The number of bytes to write. If not supplied, defaults to `buffer.length - offset`.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     */
    export function writeSync(fd: number, buffer: NodeJS.ArrayBufferView, offset?: number | null, length?: number | null, position?: number | null): number;

    /**
     * Synchronously writes `string` to the file referenced by the supplied file descriptor, returning the number of bytes written.
     * @param fd A file descriptor.
     * @param string A string to write.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     * @param encoding The expected string encoding.
     */
    export function writeSync(fd: number, string: string, position?: number | null, encoding?: BufferEncoding | null): number;

    /**
     * Asynchronously reads data from the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param buffer The buffer that the data will be written to.
     * @param offset The offset in the buffer at which to start writing.
     * @param length The number of bytes to read.
     * @param position The offset from the beginning of the file from which data should be read. If `null`, data will be read from the current position.
     */
    export function read<TBuffer extends NodeJS.ArrayBufferView>(
        fd: number,
        buffer: TBuffer,
        offset: number,
        length: number,
        position: number | null,
        callback: (err: NodeJS.ErrnoException | null, bytesRead: number, buffer: TBuffer) => void,
    ): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace read {
        /**
         * @param fd A file descriptor.
         * @param buffer The buffer that the data will be written to.
         * @param offset The offset in the buffer at which to start writing.
         * @param length The number of bytes to read.
         * @param position The offset from the beginning of the file from which data should be read. If `null`, data will be read from the current position.
         */
        function __promisify__<TBuffer extends NodeJS.ArrayBufferView>(
            fd: number,
            buffer: TBuffer,
            offset: number,
            length: number,
            position: number | null
        ): Promise<{ bytesRead: number, buffer: TBuffer }>;
    }

    export interface ReadSyncOptions {
        /**
         * @default 0
         */
        offset?: number | undefined;
        /**
         * @default `length of buffer`
         */
        length?: number | undefined;
        /**
         * @default null
         */
        position?: number | null | undefined;
    }

    /**
     * Synchronously reads data from the file referenced by the supplied file descriptor, returning the number of bytes read.
     * @param fd A file descriptor.
     * @param buffer The buffer that the data will be written to.
     * @param offset The offset in the buffer at which to start writing.
     * @param length The number of bytes to read.
     * @param position The offset from the beginning of the file from which data should be read. If `null`, data will be read from the current position.
     */
    export function readSync(fd: number, buffer: NodeJS.ArrayBufferView, offset: number, length: number, position: number | null): number;

    /**
     * Similar to the above `fs.readSync` function, this version takes an optional `options` object.
     * If no `options` object is specified, it will default with the above values.
     */
    export function readSync(fd: number, buffer: NodeJS.ArrayBufferView, opts?: ReadSyncOptions): number;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options An object that may contain an optional flag.
     * If a flag is not provided, it defaults to `'r'`.
     */
    export function readFile(
        path: PathLike | number,
        options: { encoding?: null | undefined; flag?: string | undefined; } | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
    ): void;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
     * If a flag is not provided, it defaults to `'r'`.
     */
    export function readFile(
        path: PathLike | number,
        options: { encoding: BufferEncoding; flag?: string | undefined; } | string,
        callback: (err: NodeJS.ErrnoException | null, data: string) => void
    ): void;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
     * If a flag is not provided, it defaults to `'r'`.
     */
    export function readFile(
        path: PathLike | number,
        options: BaseEncodingOptions & { flag?: string | undefined; } | string | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void,
    ): void;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     */
    export function readFile(path: PathLike | number, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace readFile {
        /**
         * Asynchronously reads the entire contents of a file.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param options An object that may contain an optional flag.
         * If a flag is not provided, it defaults to `'r'`.
         */
        function __promisify__(path: PathLike | number, options?: { encoding?: null | undefined; flag?: string | undefined; } | null): Promise<Buffer>;

        /**
         * Asynchronously reads the entire contents of a file.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * URL support is _experimental_.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
         * If a flag is not provided, it defaults to `'r'`.
         */
        function __promisify__(path: PathLike | number, options: { encoding: BufferEncoding; flag?: string | undefined; } | string): Promise<string>;

        /**
         * Asynchronously reads the entire contents of a file.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * URL support is _experimental_.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
         * If a flag is not provided, it defaults to `'r'`.
         */
        function __promisify__(path: PathLike | number, options?: BaseEncodingOptions & { flag?: string | undefined; } | string | null): Promise<string | Buffer>;
    }

    /**
     * Synchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options An object that may contain an optional flag. If a flag is not provided, it defaults to `'r'`.
     */
    export function readFileSync(path: PathLike | number, options?: { encoding?: null | undefined; flag?: string | undefined; } | null): Buffer;

    /**
     * Synchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
     * If a flag is not provided, it defaults to `'r'`.
     */
    export function readFileSync(path: PathLike | number, options: { encoding: BufferEncoding; flag?: string | undefined; } | BufferEncoding): string;

    /**
     * Synchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
     * If a flag is not provided, it defaults to `'r'`.
     */
    export function readFileSync(path: PathLike | number, options?: BaseEncodingOptions & { flag?: string | undefined; } | BufferEncoding | null): string | Buffer;

    export type WriteFileOptions = BaseEncodingOptions & { mode?: Mode | undefined; flag?: string | undefined; } | string | null;

    /**
     * Asynchronously writes data to a file, replacing the file if it already exists.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `mode` is not supplied, the default of `0o666` is used.
     * If `mode` is a string, it is parsed as an octal integer.
     * If `flag` is not supplied, the default of `'w'` is used.
     */
    export function writeFile(path: PathLike | number, data: string | NodeJS.ArrayBufferView, options: WriteFileOptions, callback: NoParamCallback): void;

    /**
     * Asynchronously writes data to a file, replacing the file if it already exists.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     */
    export function writeFile(path: PathLike | number, data: string | NodeJS.ArrayBufferView, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace writeFile {
        /**
         * Asynchronously writes data to a file, replacing the file if it already exists.
         * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
         * URL support is _experimental_.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
         * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
         * If `encoding` is not supplied, the default of `'utf8'` is used.
         * If `mode` is not supplied, the default of `0o666` is used.
         * If `mode` is a string, it is parsed as an octal integer.
         * If `flag` is not supplied, the default of `'w'` is used.
         */
        function __promisify__(path: PathLike | number, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions): Promise<void>;
    }

    /**
     * Synchronously writes data to a file, replacing the file if it already exists.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `mode` is not supplied, the default of `0o666` is used.
     * If `mode` is a string, it is parsed as an octal integer.
     * If `flag` is not supplied, the default of `'w'` is used.
     */
    export function writeFileSync(path: PathLike | number, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions): void;

    /**
     * Asynchronously append data to a file, creating the file if it does not exist.
     * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `mode` is not supplied, the default of `0o666` is used.
     * If `mode` is a string, it is parsed as an octal integer.
     * If `flag` is not supplied, the default of `'a'` is used.
     */
    export function appendFile(file: PathLike | number, data: string | Uint8Array, options: WriteFileOptions, callback: NoParamCallback): void;

    /**
     * Asynchronously append data to a file, creating the file if it does not exist.
     * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     */
    export function appendFile(file: PathLike | number, data: string | Uint8Array, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace appendFile {
        /**
         * Asynchronously append data to a file, creating the file if it does not exist.
         * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
         * URL support is _experimental_.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
         * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
         * If `encoding` is not supplied, the default of `'utf8'` is used.
         * If `mode` is not supplied, the default of `0o666` is used.
         * If `mode` is a string, it is parsed as an octal integer.
         * If `flag` is not supplied, the default of `'a'` is used.
         */
        function __promisify__(file: PathLike | number, data: string | Uint8Array, options?: WriteFileOptions): Promise<void>;
    }

    /**
     * Synchronously append data to a file, creating the file if it does not exist.
     * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `mode` is not supplied, the default of `0o666` is used.
     * If `mode` is a string, it is parsed as an octal integer.
     * If `flag` is not supplied, the default of `'a'` is used.
     */
    export function appendFileSync(file: PathLike | number, data: string | Uint8Array, options?: WriteFileOptions): void;

    /**
     * Watch for changes on `filename`. The callback `listener` will be called each time the file is accessed.
     */
    export function watchFile(filename: PathLike, options: { persistent?: boolean | undefined; interval?: number | undefined; } | undefined, listener: (curr: Stats, prev: Stats) => void): void;

    /**
     * Watch for changes on `filename`. The callback `listener` will be called each time the file is accessed.
     * @param filename A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function watchFile(filename: PathLike, listener: (curr: Stats, prev: Stats) => void): void;

    /**
     * Stop watching for changes on `filename`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function unwatchFile(filename: PathLike, listener?: (curr: Stats, prev: Stats) => void): void;

    /**
     * Watch for changes on `filename`, where `filename` is either a file or a directory, returning an `FSWatcher`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * @param options Either the encoding for the filename provided to the listener, or an object optionally specifying encoding, persistent, and recursive options.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `persistent` is not supplied, the default of `true` is used.
     * If `recursive` is not supplied, the default of `false` is used.
     */
    export function watch(
        filename: PathLike,
        options: { encoding?: BufferEncoding | null | undefined, persistent?: boolean | undefined, recursive?: boolean | undefined } | BufferEncoding | undefined | null,
        listener?: (event: "rename" | "change", filename: string) => void,
    ): FSWatcher;

    /**
     * Watch for changes on `filename`, where `filename` is either a file or a directory, returning an `FSWatcher`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * @param options Either the encoding for the filename provided to the listener, or an object optionally specifying encoding, persistent, and recursive options.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `persistent` is not supplied, the default of `true` is used.
     * If `recursive` is not supplied, the default of `false` is used.
     */
    export function watch(
        filename: PathLike,
        options: { encoding: "buffer", persistent?: boolean | undefined, recursive?: boolean | undefined; } | "buffer",
        listener?: (event: "rename" | "change", filename: Buffer) => void
    ): FSWatcher;

    /**
     * Watch for changes on `filename`, where `filename` is either a file or a directory, returning an `FSWatcher`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * @param options Either the encoding for the filename provided to the listener, or an object optionally specifying encoding, persistent, and recursive options.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `persistent` is not supplied, the default of `true` is used.
     * If `recursive` is not supplied, the default of `false` is used.
     */
    export function watch(
        filename: PathLike,
        options: { encoding?: BufferEncoding | null | undefined, persistent?: boolean | undefined, recursive?: boolean | undefined } | string | null,
        listener?: (event: "rename" | "change", filename: string | Buffer) => void,
    ): FSWatcher;

    /**
     * Watch for changes on `filename`, where `filename` is either a file or a directory, returning an `FSWatcher`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function watch(filename: PathLike, listener?: (event: "rename" | "change", filename: string) => any): FSWatcher;

    /**
     * Asynchronously tests whether or not the given path exists by checking with the file system.
     * @deprecated since v1.0.0 Use `fs.stat()` or `fs.access()` instead
     * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function exists(path: PathLike, callback: (exists: boolean) => void): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace exists {
        /**
         * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
         * URL support is _experimental_.
         */
        function __promisify__(path: PathLike): Promise<boolean>;
    }

    /**
     * Synchronously tests whether or not the given path exists by checking with the file system.
     * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function existsSync(path: PathLike): boolean;

    export namespace constants {
        // File Access Constants

        /** Constant for fs.access(). File is visible to the calling process. */
        const F_OK: number;

        /** Constant for fs.access(). File can be read by the calling process. */
        const R_OK: number;

        /** Constant for fs.access(). File can be written by the calling process. */
        const W_OK: number;

        /** Constant for fs.access(). File can be executed by the calling process. */
        const X_OK: number;

        // File Copy Constants

        /** Constant for fs.copyFile. Flag indicating the destination file should not be overwritten if it already exists. */
        const COPYFILE_EXCL: number;

        /**
         * Constant for fs.copyFile. copy operation will attempt to create a copy-on-write reflink.
         * If the underlying platform does not support copy-on-write, then a fallback copy mechanism is used.
         */
        const COPYFILE_FICLONE: number;

        /**
         * Constant for fs.copyFile. Copy operation will attempt to create a copy-on-write reflink.
         * If the underlying platform does not support copy-on-write, then the operation will fail with an error.
         */
        const COPYFILE_FICLONE_FORCE: number;

        // File Open Constants

        /** Constant for fs.open(). Flag indicating to open a file for read-only access. */
        const O_RDONLY: number;

        /** Constant for fs.open(). Flag indicating to open a file for write-only access. */
        const O_WRONLY: number;

        /** Constant for fs.open(). Flag indicating to open a file for read-write access. */
        const O_RDWR: number;

        /** Constant for fs.open(). Flag indicating to create the file if it does not already exist. */
        const O_CREAT: number;

        /** Constant for fs.open(). Flag indicating that opening a file should fail if the O_CREAT flag is set and the file already exists. */
        const O_EXCL: number;

        /**
         * Constant for fs.open(). Flag indicating that if path identifies a terminal device,
         * opening the path shall not cause that terminal to become the controlling terminal for the process
         * (if the process does not already have one).
         */
        const O_NOCTTY: number;

        /** Constant for fs.open(). Flag indicating that if the file exists and is a regular file, and the file is opened successfully for write access, its length shall be truncated to zero. */
        const O_TRUNC: number;

        /** Constant for fs.open(). Flag indicating that data will be appended to the end of the file. */
        const O_APPEND: number;

        /** Constant for fs.open(). Flag indicating that the open should fail if the path is not a directory. */
        const O_DIRECTORY: number;

        /**
         * constant for fs.open().
         * Flag indicating reading accesses to the file system will no longer result in
         * an update to the atime information associated with the file.
         * This flag is available on Linux operating systems only.
         */
        const O_NOATIME: number;

        /** Constant for fs.open(). Flag indicating that the open should fail if the path is a symbolic link. */
        const O_NOFOLLOW: number;

        /** Constant for fs.open(). Flag indicating that the file is opened for synchronous I/O. */
        const O_SYNC: number;

        /** Constant for fs.open(). Flag indicating that the file is opened for synchronous I/O with write operations waiting for data integrity. */
        const O_DSYNC: number;

        /** Constant for fs.open(). Flag indicating to open the symbolic link itself rather than the resource it is pointing to. */
        const O_SYMLINK: number;

        /** Constant for fs.open(). When set, an attempt will be made to minimize caching effects of file I/O. */
        const O_DIRECT: number;

        /** Constant for fs.open(). Flag indicating to open the file in nonblocking mode when possible. */
        const O_NONBLOCK: number;

        // File Type Constants

        /** Constant for fs.Stats mode property for determining a file's type. Bit mask used to extract the file type code. */
        const S_IFMT: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a regular file. */
        const S_IFREG: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a directory. */
        const S_IFDIR: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a character-oriented device file. */
        const S_IFCHR: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a block-oriented device file. */
        const S_IFBLK: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a FIFO/pipe. */
        const S_IFIFO: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a symbolic link. */
        const S_IFLNK: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a socket. */
        const S_IFSOCK: number;

        // File Mode Constants

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable, writable and executable by owner. */
        const S_IRWXU: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable by owner. */
        const S_IRUSR: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating writable by owner. */
        const S_IWUSR: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating executable by owner. */
        const S_IXUSR: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable, writable and executable by group. */
        const S_IRWXG: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable by group. */
        const S_IRGRP: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating writable by group. */
        const S_IWGRP: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating executable by group. */
        const S_IXGRP: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable, writable and executable by others. */
        const S_IRWXO: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable by others. */
        const S_IROTH: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating writable by others. */
        const S_IWOTH: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating executable by others. */
        const S_IXOTH: number;

        /**
         * When set, a memory file mapping is used to access the file. This flag
         * is available on Windows operating systems only. On other operating systems,
         * this flag is ignored.
         */
        const UV_FS_O_FILEMAP: number;
    }

    /**
     * Asynchronously tests a user's permissions for the file specified by path.
     * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function access(path: PathLike, mode: number | undefined, callback: NoParamCallback): void;

    /**
     * Asynchronously tests a user's permissions for the file specified by path.
     * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function access(path: PathLike, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace access {
        /**
         * Asynchronously tests a user's permissions for the file specified by path.
         * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
         * URL support is _experimental_.
         */
        function __promisify__(path: PathLike, mode?: number): Promise<void>;
    }

    /**
     * Synchronously tests a user's permissions for the file specified by path.
     * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function accessSync(path: PathLike, mode?: number): void;

    /**
     * Returns a new `ReadStream` object.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function createReadStream(path: PathLike, options?: string | {
        flags?: string | undefined;
        encoding?: BufferEncoding | undefined;
        fd?: number | undefined;
        mode?: number | undefined;
        autoClose?: boolean | undefined;
        /**
         * @default false
         */
        emitClose?: boolean | undefined;
        start?: number | undefined;
        end?: number | undefined;
        highWaterMark?: number | undefined;
    }): ReadStream;

    /**
     * Returns a new `WriteStream` object.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    export function createWriteStream(path: PathLike, options?: string | {
        flags?: string | undefined;
        encoding?: BufferEncoding | undefined;
        fd?: number | undefined;
        mode?: number | undefined;
        autoClose?: boolean | undefined;
        emitClose?: boolean | undefined;
        start?: number | undefined;
        highWaterMark?: number | undefined;
    }): WriteStream;

    /**
     * Asynchronous fdatasync(2) - synchronize a file's in-core state with storage device.
     * @param fd A file descriptor.
     */
    export function fdatasync(fd: number, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fdatasync {
        /**
         * Asynchronous fdatasync(2) - synchronize a file's in-core state with storage device.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number): Promise<void>;
    }

    /**
     * Synchronous fdatasync(2) - synchronize a file's in-core state with storage device.
     * @param fd A file descriptor.
     */
    export function fdatasyncSync(fd: number): void;

    /**
     * Asynchronously copies src to dest. By default, dest is overwritten if it already exists.
     * No arguments other than a possible exception are given to the callback function.
     * Node.js makes no guarantees about the atomicity of the copy operation.
     * If an error occurs after the destination file has been opened for writing, Node.js will attempt
     * to remove the destination.
     * @param src A path to the source file.
     * @param dest A path to the destination file.
     */
    export function copyFile(src: PathLike, dest: PathLike, callback: NoParamCallback): void;
    /**
     * Asynchronously copies src to dest. By default, dest is overwritten if it already exists.
     * No arguments other than a possible exception are given to the callback function.
     * Node.js makes no guarantees about the atomicity of the copy operation.
     * If an error occurs after the destination file has been opened for writing, Node.js will attempt
     * to remove the destination.
     * @param src A path to the source file.
     * @param dest A path to the destination file.
     * @param flags An integer that specifies the behavior of the copy operation. The only supported flag is fs.constants.COPYFILE_EXCL, which causes the copy operation to fail if dest already exists.
     */
    export function copyFile(src: PathLike, dest: PathLike, flags: number, callback: NoParamCallback): void;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace copyFile {
        /**
         * Asynchronously copies src to dest. By default, dest is overwritten if it already exists.
         * No arguments other than a possible exception are given to the callback function.
         * Node.js makes no guarantees about the atomicity of the copy operation.
         * If an error occurs after the destination file has been opened for writing, Node.js will attempt
         * to remove the destination.
         * @param src A path to the source file.
         * @param dest A path to the destination file.
         * @param flags An optional integer that specifies the behavior of the copy operation.
         * The only supported flag is fs.constants.COPYFILE_EXCL,
         * which causes the copy operation to fail if dest already exists.
         */
        function __promisify__(src: PathLike, dst: PathLike, flags?: number): Promise<void>;
    }

    /**
     * Synchronously copies src to dest. By default, dest is overwritten if it already exists.
     * Node.js makes no guarantees about the atomicity of the copy operation.
     * If an error occurs after the destination file has been opened for writing, Node.js will attempt
     * to remove the destination.
     * @param src A path to the source file.
     * @param dest A path to the destination file.
     * @param flags An optional integer that specifies the behavior of the copy operation.
     * The only supported flag is fs.constants.COPYFILE_EXCL, which causes the copy operation to fail if dest already exists.
     */
    export function copyFileSync(src: PathLike, dest: PathLike, flags?: number): void;

    /**
     * Write an array of ArrayBufferViews to the file specified by fd using writev().
     * position is the offset from the beginning of the file where this data should be written.
     * It is unsafe to use fs.writev() multiple times on the same file without waiting for the callback. For this scenario, use fs.createWriteStream().
     * On Linux, positional writes don't work when the file is opened in append mode.
     * The kernel ignores the position argument and always appends the data to the end of the file.
     */
    export function writev(
        fd: number,
        buffers: ReadonlyArray<NodeJS.ArrayBufferView>,
        cb: (err: NodeJS.ErrnoException | null, bytesWritten: number, buffers: NodeJS.ArrayBufferView[]) => void
    ): void;
    export function writev(
        fd: number,
        buffers: ReadonlyArray<NodeJS.ArrayBufferView>,
        position: number,
        cb: (err: NodeJS.ErrnoException | null, bytesWritten: number, buffers: NodeJS.ArrayBufferView[]) => void
    ): void;

    export interface WriteVResult {
        bytesWritten: number;
        buffers: NodeJS.ArrayBufferView[];
    }

    export namespace writev {
        function __promisify__(fd: number, buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): Promise<WriteVResult>;
    }

    /**
     * See `writev`.
     */
    export function writevSync(fd: number, buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): number;

    export function readv(
        fd: number,
        buffers: ReadonlyArray<NodeJS.ArrayBufferView>,
        cb: (err: NodeJS.ErrnoException | null, bytesRead: number, buffers: NodeJS.ArrayBufferView[]) => void
    ): void;
    export function readv(
        fd: number,
        buffers: ReadonlyArray<NodeJS.ArrayBufferView>,
        position: number,
        cb: (err: NodeJS.ErrnoException | null, bytesRead: number, buffers: NodeJS.ArrayBufferView[]) => void
    ): void;

    export interface ReadVResult {
        bytesRead: number;
        buffers: NodeJS.ArrayBufferView[];
    }

    export namespace readv {
        function __promisify__(fd: number, buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): Promise<ReadVResult>;
    }

    /**
     * See `readv`.
     */
    export function readvSync(fd: number, buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): number;

    export interface OpenDirOptions {
        encoding?: BufferEncoding | undefined;
        /**
         * Number of directory entries that are buffered
         * internally when reading from the directory. Higher values lead to better
         * performance but higher memory usage.
         * @default 32
         */
        bufferSize?: number | undefined;
    }

    export function opendirSync(path: string, options?: OpenDirOptions): Dir;

    export function opendir(path: string, cb: (err: NodeJS.ErrnoException | null, dir: Dir) => void): void;
    export function opendir(path: string, options: OpenDirOptions, cb: (err: NodeJS.ErrnoException | null, dir: Dir) => void): void;

    export namespace opendir {
        function __promisify__(path: string, options?: OpenDirOptions): Promise<Dir>;
    }

    export interface BigIntStats extends StatsBase<bigint> {
    }

    export class BigIntStats {
        atimeNs: bigint;
        mtimeNs: bigint;
        ctimeNs: bigint;
        birthtimeNs: bigint;
    }

    export interface BigIntOptions {
        bigint: true;
    }

    export interface StatOptions {
        bigint?: boolean | undefined;
    }
}
