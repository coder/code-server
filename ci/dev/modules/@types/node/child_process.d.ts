declare module 'child_process' {
    import { BaseEncodingOptions } from 'fs';
    import * as events from 'events';
    import * as net from 'net';
    import { Writable, Readable, Stream, Pipe } from 'stream';

    type Serializable = string | object | number | boolean;
    type SendHandle = net.Socket | net.Server;

    interface ChildProcess extends events.EventEmitter {
        stdin: Writable | null;
        stdout: Readable | null;
        stderr: Readable | null;
        readonly channel?: Pipe | null | undefined;
        readonly stdio: [
            Writable | null, // stdin
            Readable | null, // stdout
            Readable | null, // stderr
            Readable | Writable | null | undefined, // extra
            Readable | Writable | null | undefined // extra
        ];
        readonly killed: boolean;
        readonly pid: number;
        readonly connected: boolean;
        readonly exitCode: number | null;
        readonly signalCode: NodeJS.Signals | null;
        readonly spawnargs: string[];
        readonly spawnfile: string;
        kill(signal?: NodeJS.Signals | number): boolean;
        send(message: Serializable, callback?: (error: Error | null) => void): boolean;
        send(message: Serializable, sendHandle?: SendHandle, callback?: (error: Error | null) => void): boolean;
        send(message: Serializable, sendHandle?: SendHandle, options?: MessageOptions, callback?: (error: Error | null) => void): boolean;
        disconnect(): void;
        unref(): void;
        ref(): void;

        /**
         * events.EventEmitter
         * 1. close
         * 2. disconnect
         * 3. error
         * 4. exit
         * 5. message
         */

        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        addListener(event: "disconnect", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        addListener(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "close", code: number | null, signal: NodeJS.Signals | null): boolean;
        emit(event: "disconnect"): boolean;
        emit(event: "error", err: Error): boolean;
        emit(event: "exit", code: number | null, signal: NodeJS.Signals | null): boolean;
        emit(event: "message", message: Serializable, sendHandle: SendHandle): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        on(event: "disconnect", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        on(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        once(event: "disconnect", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        once(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        prependListener(event: "disconnect", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        prependListener(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        prependOnceListener(event: "disconnect", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        prependOnceListener(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;
    }

    // return this object when stdio option is undefined or not specified
    interface ChildProcessWithoutNullStreams extends ChildProcess {
        stdin: Writable;
        stdout: Readable;
        stderr: Readable;
        readonly stdio: [
            Writable, // stdin
            Readable, // stdout
            Readable, // stderr
            Readable | Writable | null | undefined, // extra, no modification
            Readable | Writable | null | undefined // extra, no modification
        ];
    }

    // return this object when stdio option is a tuple of 3
    interface ChildProcessByStdio<
        I extends null | Writable,
        O extends null | Readable,
        E extends null | Readable,
    > extends ChildProcess {
        stdin: I;
        stdout: O;
        stderr: E;
        readonly stdio: [
            I,
            O,
            E,
            Readable | Writable | null | undefined, // extra, no modification
            Readable | Writable | null | undefined // extra, no modification
        ];
    }

    interface MessageOptions {
        keepOpen?: boolean | undefined;
    }

    type StdioOptions = "pipe" | "ignore" | "inherit" | Array<("pipe" | "ipc" | "ignore" | "inherit" | Stream | number | null | undefined)>;

    type SerializationType = 'json' | 'advanced';

    interface MessagingOptions {
        /**
         * Specify the kind of serialization used for sending messages between processes.
         * @default 'json'
         */
        serialization?: SerializationType | undefined;
    }

    interface ProcessEnvOptions {
        uid?: number | undefined;
        gid?: number | undefined;
        cwd?: string | undefined;
        env?: NodeJS.ProcessEnv | undefined;
    }

    interface CommonOptions extends ProcessEnvOptions {
        /**
         * @default true
         */
        windowsHide?: boolean | undefined;
        /**
         * @default 0
         */
        timeout?: number | undefined;
    }

    interface CommonSpawnOptions extends CommonOptions, MessagingOptions {
        argv0?: string | undefined;
        stdio?: StdioOptions | undefined;
        shell?: boolean | string | undefined;
        windowsVerbatimArguments?: boolean | undefined;
    }

    interface SpawnOptions extends CommonSpawnOptions {
        detached?: boolean | undefined;
    }

    interface SpawnOptionsWithoutStdio extends SpawnOptions {
        stdio?: 'pipe' | Array<null | undefined | 'pipe'> | undefined;
    }

    type StdioNull = 'inherit' | 'ignore' | Stream;
    type StdioPipe = undefined | null | 'pipe';

    interface SpawnOptionsWithStdioTuple<
        Stdin extends StdioNull | StdioPipe,
        Stdout extends StdioNull | StdioPipe,
        Stderr extends StdioNull | StdioPipe,
    > extends SpawnOptions {
        stdio: [Stdin, Stdout, Stderr];
    }

    // overloads of spawn without 'args'
    function spawn(command: string, options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams;

    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioPipe>,
    ): ChildProcessByStdio<Writable, Readable, Readable>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioNull>,
    ): ChildProcessByStdio<Writable, Readable, null>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioNull, StdioPipe>,
    ): ChildProcessByStdio<Writable, null, Readable>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioPipe>,
    ): ChildProcessByStdio<null, Readable, Readable>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioNull, StdioNull>,
    ): ChildProcessByStdio<Writable, null, null>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioNull>,
    ): ChildProcessByStdio<null, Readable, null>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioPipe>,
    ): ChildProcessByStdio<null, null, Readable>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioNull>,
    ): ChildProcessByStdio<null, null, null>;

    function spawn(command: string, options: SpawnOptions): ChildProcess;

    // overloads of spawn with 'args'
    function spawn(command: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams;

    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioPipe>,
    ): ChildProcessByStdio<Writable, Readable, Readable>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioNull>,
    ): ChildProcessByStdio<Writable, Readable, null>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioNull, StdioPipe>,
    ): ChildProcessByStdio<Writable, null, Readable>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioPipe>,
    ): ChildProcessByStdio<null, Readable, Readable>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioNull, StdioNull>,
    ): ChildProcessByStdio<Writable, null, null>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioNull>,
    ): ChildProcessByStdio<null, Readable, null>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioPipe>,
    ): ChildProcessByStdio<null, null, Readable>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioNull>,
    ): ChildProcessByStdio<null, null, null>;

    function spawn(command: string, args: ReadonlyArray<string>, options: SpawnOptions): ChildProcess;

    interface ExecOptions extends CommonOptions {
        shell?: string | undefined;
        maxBuffer?: number | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
    }

    interface ExecOptionsWithStringEncoding extends ExecOptions {
        encoding: BufferEncoding;
    }

    interface ExecOptionsWithBufferEncoding extends ExecOptions {
        encoding: BufferEncoding | null; // specify `null`.
    }

    interface ExecException extends Error {
        cmd?: string | undefined;
        killed?: boolean | undefined;
        code?: number | undefined;
        signal?: NodeJS.Signals | undefined;
    }

    // no `options` definitely means stdout/stderr are `string`.
    function exec(command: string, callback?: (error: ExecException | null, stdout: string, stderr: string) => void): ChildProcess;

    // `options` with `"buffer"` or `null` for `encoding` means stdout/stderr are definitely `Buffer`.
    function exec(command: string, options: { encoding: "buffer" | null } & ExecOptions, callback?: (error: ExecException | null, stdout: Buffer, stderr: Buffer) => void): ChildProcess;

    // `options` with well known `encoding` means stdout/stderr are definitely `string`.
    function exec(command: string, options: { encoding: BufferEncoding } & ExecOptions, callback?: (error: ExecException | null, stdout: string, stderr: string) => void): ChildProcess;

    // `options` with an `encoding` whose type is `string` means stdout/stderr could either be `Buffer` or `string`.
    // There is no guarantee the `encoding` is unknown as `string` is a superset of `BufferEncoding`.
    function exec(
        command: string,
        options: { encoding: BufferEncoding } & ExecOptions,
        callback?: (error: ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => void,
    ): ChildProcess;

    // `options` without an `encoding` means stdout/stderr are definitely `string`.
    function exec(command: string, options: ExecOptions, callback?: (error: ExecException | null, stdout: string, stderr: string) => void): ChildProcess;

    // fallback if nothing else matches. Worst case is always `string | Buffer`.
    function exec(
        command: string,
        options: (BaseEncodingOptions & ExecOptions) | undefined | null,
        callback?: (error: ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => void,
    ): ChildProcess;

    interface PromiseWithChild<T> extends Promise<T> {
        child: ChildProcess;
    }

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    namespace exec {
        function __promisify__(command: string): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(command: string, options: { encoding: "buffer" | null } & ExecOptions): PromiseWithChild<{ stdout: Buffer, stderr: Buffer }>;
        function __promisify__(command: string, options: { encoding: BufferEncoding } & ExecOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(command: string, options: ExecOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(command: string, options?: (BaseEncodingOptions & ExecOptions) | null): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
    }

    interface ExecFileOptions extends CommonOptions {
        maxBuffer?: number | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
        windowsVerbatimArguments?: boolean | undefined;
        shell?: boolean | string | undefined;
    }
    interface ExecFileOptionsWithStringEncoding extends ExecFileOptions {
        encoding: BufferEncoding;
    }
    interface ExecFileOptionsWithBufferEncoding extends ExecFileOptions {
        encoding: 'buffer' | null;
    }
    interface ExecFileOptionsWithOtherEncoding extends ExecFileOptions {
        encoding: BufferEncoding;
    }
    type ExecFileException = ExecException & NodeJS.ErrnoException;

    function execFile(file: string): ChildProcess;
    function execFile(file: string, options: (BaseEncodingOptions & ExecFileOptions) | undefined | null): ChildProcess;
    function execFile(file: string, args?: ReadonlyArray<string> | null): ChildProcess;
    function execFile(file: string, args: ReadonlyArray<string> | undefined | null, options: (BaseEncodingOptions & ExecFileOptions) | undefined | null): ChildProcess;

    // no `options` definitely means stdout/stderr are `string`.
    function execFile(file: string, callback: (error: ExecFileException | null, stdout: string, stderr: string) => void): ChildProcess;
    function execFile(file: string, args: ReadonlyArray<string> | undefined | null, callback: (error: ExecFileException | null, stdout: string, stderr: string) => void): ChildProcess;

    // `options` with `"buffer"` or `null` for `encoding` means stdout/stderr are definitely `Buffer`.
    function execFile(file: string, options: ExecFileOptionsWithBufferEncoding, callback: (error: ExecFileException | null, stdout: Buffer, stderr: Buffer) => void): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: ExecFileOptionsWithBufferEncoding,
        callback: (error: ExecFileException | null, stdout: Buffer, stderr: Buffer) => void,
    ): ChildProcess;

    // `options` with well known `encoding` means stdout/stderr are definitely `string`.
    function execFile(file: string, options: ExecFileOptionsWithStringEncoding, callback: (error: ExecFileException | null, stdout: string, stderr: string) => void): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: ExecFileOptionsWithStringEncoding,
        callback: (error: ExecFileException | null, stdout: string, stderr: string) => void,
    ): ChildProcess;

    // `options` with an `encoding` whose type is `string` means stdout/stderr could either be `Buffer` or `string`.
    // There is no guarantee the `encoding` is unknown as `string` is a superset of `BufferEncoding`.
    function execFile(
        file: string,
        options: ExecFileOptionsWithOtherEncoding,
        callback: (error: ExecFileException | null, stdout: string | Buffer, stderr: string | Buffer) => void,
    ): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: ExecFileOptionsWithOtherEncoding,
        callback: (error: ExecFileException | null, stdout: string | Buffer, stderr: string | Buffer) => void,
    ): ChildProcess;

    // `options` without an `encoding` means stdout/stderr are definitely `string`.
    function execFile(file: string, options: ExecFileOptions, callback: (error: ExecFileException | null, stdout: string, stderr: string) => void): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: ExecFileOptions,
        callback: (error: ExecFileException | null, stdout: string, stderr: string) => void
    ): ChildProcess;

    // fallback if nothing else matches. Worst case is always `string | Buffer`.
    function execFile(
        file: string,
        options: (BaseEncodingOptions & ExecFileOptions) | undefined | null,
        callback: ((error: ExecFileException | null, stdout: string | Buffer, stderr: string | Buffer) => void) | undefined | null,
    ): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: (BaseEncodingOptions & ExecFileOptions) | undefined | null,
        callback: ((error: ExecFileException | null, stdout: string | Buffer, stderr: string | Buffer) => void) | undefined | null,
    ): ChildProcess;

    // NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    namespace execFile {
        function __promisify__(file: string): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, args: ReadonlyArray<string> | undefined | null): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, options: ExecFileOptionsWithBufferEncoding): PromiseWithChild<{ stdout: Buffer, stderr: Buffer }>;
        function __promisify__(file: string, args: ReadonlyArray<string> | undefined | null, options: ExecFileOptionsWithBufferEncoding): PromiseWithChild<{ stdout: Buffer, stderr: Buffer }>;
        function __promisify__(file: string, options: ExecFileOptionsWithStringEncoding): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, args: ReadonlyArray<string> | undefined | null, options: ExecFileOptionsWithStringEncoding): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, options: ExecFileOptionsWithOtherEncoding): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
        function __promisify__(
            file: string,
            args: ReadonlyArray<string> | undefined | null,
            options: ExecFileOptionsWithOtherEncoding,
        ): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
        function __promisify__(file: string, options: ExecFileOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, args: ReadonlyArray<string> | undefined | null, options: ExecFileOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, options: (BaseEncodingOptions & ExecFileOptions) | undefined | null): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
        function __promisify__(
            file: string,
            args: ReadonlyArray<string> | undefined | null,
            options: (BaseEncodingOptions & ExecFileOptions) | undefined | null,
        ): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
    }

    interface ForkOptions extends ProcessEnvOptions, MessagingOptions {
        execPath?: string | undefined;
        execArgv?: string[] | undefined;
        silent?: boolean | undefined;
        stdio?: StdioOptions | undefined;
        detached?: boolean | undefined;
        windowsVerbatimArguments?: boolean | undefined;
    }
    function fork(modulePath: string, options?: ForkOptions): ChildProcess;
    function fork(modulePath: string, args?: ReadonlyArray<string>, options?: ForkOptions): ChildProcess;

    interface SpawnSyncOptions extends CommonSpawnOptions {
        input?: string | NodeJS.ArrayBufferView | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
        maxBuffer?: number | undefined;
        encoding?: BufferEncoding | 'buffer' | null | undefined;
    }
    interface SpawnSyncOptionsWithStringEncoding extends SpawnSyncOptions {
        encoding: BufferEncoding;
    }
    interface SpawnSyncOptionsWithBufferEncoding extends SpawnSyncOptions {
        encoding?: 'buffer' | null | undefined;
    }
    interface SpawnSyncReturns<T> {
        pid: number;
        output: string[];
        stdout: T;
        stderr: T;
        status: number | null;
        signal: NodeJS.Signals | null;
        error?: Error | undefined;
    }
    function spawnSync(command: string): SpawnSyncReturns<Buffer>;
    function spawnSync(command: string, options?: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string>;
    function spawnSync(command: string, options?: SpawnSyncOptionsWithBufferEncoding): SpawnSyncReturns<Buffer>;
    function spawnSync(command: string, options?: SpawnSyncOptions): SpawnSyncReturns<Buffer>;
    function spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string>;
    function spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptionsWithBufferEncoding): SpawnSyncReturns<Buffer>;
    function spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions): SpawnSyncReturns<Buffer>;

    interface ExecSyncOptions extends CommonOptions {
        input?: string | Uint8Array | undefined;
        stdio?: StdioOptions | undefined;
        shell?: string | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
        maxBuffer?: number | undefined;
        encoding?: BufferEncoding | 'buffer' | null | undefined;
    }
    interface ExecSyncOptionsWithStringEncoding extends ExecSyncOptions {
        encoding: BufferEncoding;
    }
    interface ExecSyncOptionsWithBufferEncoding extends ExecSyncOptions {
        encoding?: 'buffer' | null | undefined;
    }
    function execSync(command: string): Buffer;
    function execSync(command: string, options?: ExecSyncOptionsWithStringEncoding): string;
    function execSync(command: string, options?: ExecSyncOptionsWithBufferEncoding): Buffer;
    function execSync(command: string, options?: ExecSyncOptions): Buffer;

    interface ExecFileSyncOptions extends CommonOptions {
        input?: string | NodeJS.ArrayBufferView | undefined;
        stdio?: StdioOptions | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
        maxBuffer?: number | undefined;
        encoding?: BufferEncoding | undefined;
        shell?: boolean | string | undefined;
    }
    interface ExecFileSyncOptionsWithStringEncoding extends ExecFileSyncOptions {
        encoding: BufferEncoding;
    }
    interface ExecFileSyncOptionsWithBufferEncoding extends ExecFileSyncOptions {
        encoding: BufferEncoding; // specify `null`.
    }
    function execFileSync(command: string): Buffer;
    function execFileSync(command: string, options?: ExecFileSyncOptionsWithStringEncoding): string;
    function execFileSync(command: string, options?: ExecFileSyncOptionsWithBufferEncoding): Buffer;
    function execFileSync(command: string, options?: ExecFileSyncOptions): Buffer;
    function execFileSync(command: string, args?: ReadonlyArray<string>, options?: ExecFileSyncOptionsWithStringEncoding): string;
    function execFileSync(command: string, args?: ReadonlyArray<string>, options?: ExecFileSyncOptionsWithBufferEncoding): Buffer;
    function execFileSync(command: string, args?: ReadonlyArray<string>, options?: ExecFileSyncOptions): Buffer;
}
