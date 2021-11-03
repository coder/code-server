declare module 'console' {
    import { InspectOptions } from 'util';

    global {
        // This needs to be global to avoid TS2403 in case lib.dom.d.ts is present in the same build
        interface Console {
            Console: NodeJS.ConsoleConstructor;
            /**
             * A simple assertion test that verifies whether `value` is truthy.
             * If it is not, an `AssertionError` is thrown.
             * If provided, the error `message` is formatted using `util.format()` and used as the error message.
             */
            assert(value: any, message?: string, ...optionalParams: any[]): void;
            /**
             * When `stdout` is a TTY, calling `console.clear()` will attempt to clear the TTY.
             * When `stdout` is not a TTY, this method does nothing.
             */
            clear(): void;
            /**
             * Maintains an internal counter specific to `label` and outputs to `stdout` the number of times `console.count()` has been called with the given `label`.
             */
            count(label?: string): void;
            /**
             * Resets the internal counter specific to `label`.
             */
            countReset(label?: string): void;
            /**
             * The `console.debug()` function is an alias for {@link console.log}.
             */
            debug(message?: any, ...optionalParams: any[]): void;
            /**
             * Uses {@link util.inspect} on `obj` and prints the resulting string to `stdout`.
             * This function bypasses any custom `inspect()` function defined on `obj`.
             */
            dir(obj: any, options?: InspectOptions): void;
            /**
             * This method calls {@link console.log} passing it the arguments received. Please note that this method does not produce any XML formatting
             */
            dirxml(...data: any[]): void;
            /**
             * Prints to `stderr` with newline.
             */
            error(message?: any, ...optionalParams: any[]): void;
            /**
             * Increases indentation of subsequent lines by two spaces.
             * If one or more `label`s are provided, those are printed first without the additional indentation.
             */
            group(...label: any[]): void;
            /**
             * The `console.groupCollapsed()` function is an alias for {@link console.group}.
             */
            groupCollapsed(...label: any[]): void;
            /**
             * Decreases indentation of subsequent lines by two spaces.
             */
            groupEnd(): void;
            /**
             * The {@link console.info} function is an alias for {@link console.log}.
             */
            info(message?: any, ...optionalParams: any[]): void;
            /**
             * Prints to `stdout` with newline.
             */
            log(message?: any, ...optionalParams: any[]): void;
            /**
             * This method does not display anything unless used in the inspector.
             *  Prints to `stdout` the array `array` formatted as a table.
             */
            table(tabularData: any, properties?: ReadonlyArray<string>): void;
            /**
             * Starts a timer that can be used to compute the duration of an operation. Timers are identified by a unique `label`.
             */
            time(label?: string): void;
            /**
             * Stops a timer that was previously started by calling {@link console.time} and prints the result to `stdout`.
             */
            timeEnd(label?: string): void;
            /**
             * For a timer that was previously started by calling {@link console.time}, prints the elapsed time and other `data` arguments to `stdout`.
             */
            timeLog(label?: string, ...data: any[]): void;
            /**
             * Prints to `stderr` the string 'Trace :', followed by the {@link util.format} formatted message and stack trace to the current position in the code.
             */
            trace(message?: any, ...optionalParams: any[]): void;
            /**
             * The {@link console.warn} function is an alias for {@link console.error}.
             */
            warn(message?: any, ...optionalParams: any[]): void;

            // --- Inspector mode only ---
            /**
             * This method does not display anything unless used in the inspector.
             *  Starts a JavaScript CPU profile with an optional label.
             */
            profile(label?: string): void;
            /**
             * This method does not display anything unless used in the inspector.
             *  Stops the current JavaScript CPU profiling session if one has been started and prints the report to the Profiles panel of the inspector.
             */
            profileEnd(label?: string): void;
            /**
             * This method does not display anything unless used in the inspector.
             *  Adds an event with the label `label` to the Timeline panel of the inspector.
             */
            timeStamp(label?: string): void;
        }

        var console: Console;

        namespace NodeJS {
            interface ConsoleConstructorOptions {
                stdout: WritableStream;
                stderr?: WritableStream | undefined;
                ignoreErrors?: boolean | undefined;
                colorMode?: boolean | 'auto' | undefined;
                inspectOptions?: InspectOptions | undefined;
            }

            interface ConsoleConstructor {
                prototype: Console;
                new(stdout: WritableStream, stderr?: WritableStream, ignoreErrors?: boolean): Console;
                new(options: ConsoleConstructorOptions): Console;
            }

            interface Global {
                console: typeof console;
            }
        }
    }

    export = console;
}
