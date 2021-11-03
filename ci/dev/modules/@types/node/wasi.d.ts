declare module 'wasi' {
    interface WASIOptions {
        /**
         * An array of strings that the WebAssembly application will
         * see as command line arguments. The first argument is the virtual path to the
         * WASI command itself.
         */
        args?: string[] | undefined;

        /**
         * An object similar to `process.env` that the WebAssembly
         * application will see as its environment.
         */
        env?: object | undefined;

        /**
         * This object represents the WebAssembly application's
         * sandbox directory structure. The string keys of `preopens` are treated as
         * directories within the sandbox. The corresponding values in `preopens` are
         * the real paths to those directories on the host machine.
         */
        preopens?: NodeJS.Dict<string> | undefined;

        /**
         * By default, WASI applications terminate the Node.js
         * process via the `__wasi_proc_exit()` function. Setting this option to `true`
         * causes `wasi.start()` to return the exit code rather than terminate the
         * process.
         * @default false
         */
        returnOnExit?: boolean | undefined;

        /**
         * The file descriptor used as standard input in the WebAssembly application.
         * @default 0
         */
        stdin?: number | undefined;

        /**
         * The file descriptor used as standard output in the WebAssembly application.
         * @default 1
         */
        stdout?: number | undefined;

        /**
         * The file descriptor used as standard error in the WebAssembly application.
         * @default 2
         */
        stderr?: number | undefined;
    }

    class WASI {
        constructor(options?: WASIOptions);
        /**
         *
         * Attempt to begin execution of `instance` by invoking its `_start()` export.
         * If `instance` does not contain a `_start()` export, then `start()` attempts to
         * invoke the `__wasi_unstable_reactor_start()` export. If neither of those exports
         * is present on `instance`, then `start()` does nothing.
         *
         * `start()` requires that `instance` exports a [`WebAssembly.Memory`][] named
         * `memory`. If `instance` does not have a `memory` export an exception is thrown.
         *
         * If `start()` is called more than once, an exception is thrown.
         */
        start(instance: object): void; // TODO: avoid DOM dependency until WASM moved to own lib.

        /**
         * Attempt to initialize `instance` as a WASI reactor by invoking its `_initialize()` export, if it is present.
         * If `instance` contains a `_start()` export, then an exception is thrown.
         *
         * `start()` requires that `instance` exports a [`WebAssembly.Memory`][] named
         * `memory`. If `instance` does not have a `memory` export an exception is thrown.
         *
         * If `initialize()` is called more than once, an exception is thrown.
         */
        initialize(instance: object): void; // TODO: avoid DOM dependency until WASM moved to own lib.

        /**
         * Is an object that implements the WASI system call API. This object
         * should be passed as the `wasi_snapshot_preview1` import during the instantiation of a
         * [`WebAssembly.Instance`][].
         */
        readonly wasiImport: NodeJS.Dict<any>; // TODO: Narrow to DOM types
    }
}
