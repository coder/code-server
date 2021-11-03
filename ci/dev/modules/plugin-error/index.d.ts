declare namespace PluginError {
  interface Constructor {
    /**
     * @param plugin Plugin name
     * @param error Base error
     * @param options Error options
     */
    new <E extends Error>(plugin: string, error: E, options?: Options): PluginError<E>;

    /**
     * @param plugin Plugin name
     * @param error Base error or error message
     * @param options Error options
     */
    new <E extends Error = Error>(plugin: string, error: E | string, options: Options): PluginError<E | {[K in keyof E]: undefined}>;

    /**
     * @param plugin Plugin name
     * @param error Base error, error message, or options with message
     */
    new <E extends Error = Error>(plugin: string, error: E | string | (Options & {message: string})): PluginError<E | {[K in keyof E]: undefined}>;

    /**
     * @param options Options with plugin name and message
     */
    new(options: Options & {plugin: string, message: string}): PluginError;
  }

  interface Options {
    /**
     * Error name
     */
    name?: string;

    /**
     * Error message
     */
    message?: any;

    /**
     * File name where the error occurred
     */
    fileName?: string;


    /**
     * Line number where the error occurred
     */
    lineNumber?: number;

    /**
     * Error properties will be included in err.toString(). Can be omitted by
     * setting this to false.
     *
     * Default: `true`
     */
    showProperties?: boolean;

    /**
     * By default the stack will not be shown. Set this to true if you think the
     * stack is important for your error.
     *
     * Default: `false`
     */
    showStack?: boolean;

    /**
     * Error stack to use for `err.toString()` if `showStack` is `true`.
     * By default it uses the `stack` of the original error if you used one, otherwise it captures a new stack.
     */
    stack?: string;
  }

  /**
   * The `SimplePluginError` interface defines the properties available on all the the instances of `PluginError`.
   *
   * @internal
   */
  interface SimplePluginError extends Error {
    /**
     * Plugin name
     */
    plugin: string;

    /**
     * Boolean controlling if the stack will be shown in `err.toString()`.
     */
    showStack: boolean;

    /**
     * Boolean controlling if properties will be shown in `err.toString()`.
     */
    showProperties: boolean;

    /**
     * File name where the error occurred
     */
    fileName?: string;

    /**
     * Line number where the error occurred
     */
    lineNumber?: number;
  }
}

/**
 * Abstraction for error handling for Vinyl plugins
 */
type PluginError<T = {}> = PluginError.SimplePluginError & T;

declare const PluginError: PluginError.Constructor;

export = PluginError;
