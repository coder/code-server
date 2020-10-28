/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *  https://github.com/microsoft/vscode-loader/
 *--------------------------------------------------------------------------------------------*/

declare namespace AMDLoader {
  const enum LoaderEventType {
    LoaderAvailable = 1,
    BeginLoadingScript = 10,
    EndLoadingScriptOK = 11,
    EndLoadingScriptError = 12,
    BeginInvokeFactory = 21,
    EndInvokeFactory = 22,
    NodeBeginEvaluatingScript = 31,
    NodeEndEvaluatingScript = 32,
    NodeBeginNativeRequire = 33,
    NodeEndNativeRequire = 34,
    CachedDataFound = 60,
    CachedDataMissed = 61,
    CachedDataRejected = 62,
    CachedDataCreated = 63,
  }
  class LoaderEvent {
    type: LoaderEventType
    timestamp: number
    detail: string
    constructor(type: LoaderEventType, detail: string, timestamp: number)
  }
  interface IPosition {
    line: number
    col: number
  }
  interface IBuildModuleInfo {
    id: string
    path: string | null
    defineLocation: IPosition | null
    dependencies: string[]
    shim: string | null
    exports: any
  }
  interface AnnotatedLoadingError extends Error {
    phase: "loading"
    moduleId: string
    neededBy: string[]
  }
  interface AnnotatedFactoryError extends Error {
    phase: "factory"
    moduleId: string
  }
  interface AnnotatedValidationError extends Error {
    phase: "configuration"
  }
  type AnnotatedError = AnnotatedLoadingError | AnnotatedFactoryError | AnnotatedValidationError
  function ensureError<T extends Error>(err: any): T
  /**
   * The signature for the loader's AMD "define" function.
   */
  interface IDefineFunc {
    (id: "string", dependencies: string[], callback: any): void
    (id: "string", callback: any): void
    (dependencies: string[], callback: any): void
    (callback: any): void
    amd: {
      jQuery: boolean
    }
  }
  /**
   * The signature for the loader's AMD "require" function.
   */
  interface IRequireFunc {
    (module: string): any
    (config: any): void
    (modules: string[], callback: Function): void
    (modules: string[], callback: Function, errorback: (err: any) => void): void
    config(params: IConfigurationOptions, shouldOverwrite?: boolean): void
    getConfig(): IConfigurationOptions
    /**
     * Non standard extension to reset completely the loader state. This is used for running amdjs tests
     */
    reset(): void
    /**
     * Non standard extension to fetch loader state for building purposes.
     */
    getBuildInfo(): IBuildModuleInfo[] | null
    /**
     * Non standard extension to fetch loader events
     */
    getStats(): LoaderEvent[]
    /**
     * The define function
     */
    define(id: "string", dependencies: string[], callback: any): void
    define(id: "string", callback: any): void
    define(dependencies: string[], callback: any): void
    define(callback: any): void
  }
  interface IModuleConfiguration {
    [key: string]: any
  }
  interface INodeRequire {
    (nodeModule: string): any
    main: {
      filename: string
    }
  }
  interface INodeCachedDataConfiguration {
    /**
     * Directory path in which cached is stored.
     */
    path: string
    /**
     * Seed when generating names of cache files.
     */
    seed?: string
    /**
     * Optional delay for filesystem write/delete operations
     */
    writeDelay?: number
  }
  interface IConfigurationOptions {
    /**
     * The prefix that will be aplied to all modules when they are resolved to a location
     */
    baseUrl?: string
    /**
     * Redirect rules for modules. The redirect rules will affect the module ids themselves
     */
    paths?: {
      [path: string]: any
    }
    /**
     * Per-module configuration
     */
    config?: {
      [moduleId: string]: IModuleConfiguration
    }
    /**
     * Catch errors when invoking the module factories
     */
    catchError?: boolean
    /**
     * Record statistics
     */
    recordStats?: boolean
    /**
     * The suffix that will be aplied to all modules when they are resolved to a location
     */
    urlArgs?: string
    /**
     * Callback that will be called when errors are encountered
     */
    onError?: (err: AnnotatedError) => void
    /**
     * The loader will issue warnings when duplicate modules are encountered.
     * This list will inhibit those warnings if duplicate modules are expected.
     */
    ignoreDuplicateModules?: string[]
    /**
     * Flag to indicate if current execution is as part of a build. Used by plugins
     */
    isBuild?: boolean
    /**
     * Content Security Policy nonce value used to load child scripts.
     */
    cspNonce?: string
    /**
     * If running inside an electron renderer, prefer using <script> tags to load code.
     * Defaults to false.
     */
    preferScriptTags?: boolean
    /**
     * A callback that enables use of TrustedScriptURL instead of strings, see
     * https://w3c.github.io/webappsec-trusted-types/dist/spec/#introduction.
     *
     * The implementation of this callback should validate the given value (which
     * represents a script source value) and throw an error if validation fails.
     */
    createTrustedScriptURL?: (value: string) => string
    /**
     * A regex to help determine if a module is an AMD module or a node module.
     * If defined, then all amd modules in the system must match this regular expression.
     */
    amdModulesPattern?: RegExp
    /**
     * A list of known node modules that should be directly loaded via node's require.
     */
    nodeModules?: string[]
    /**
     * The main entry point node's require
     */
    nodeRequire?: INodeRequire
    /**
     * An optional transformation applied to the source before it is loaded in node's vm
     */
    nodeInstrumenter?: (source: string, vmScriptSrc: string) => string
    /**
     * The main entry point.
     */
    nodeMain?: string
    /**
     * Support v8 cached data (http://v8project.blogspot.co.uk/2015/07/code-caching.html)
     */
    nodeCachedData?: INodeCachedDataConfiguration
  }
  interface IValidatedConfigurationOptions extends IConfigurationOptions {
    baseUrl: string
    paths: {
      [path: string]: any
    }
    config: {
      [moduleId: string]: IModuleConfiguration
    }
    catchError: boolean
    recordStats: boolean
    urlArgs: string
    onError: (err: AnnotatedError) => void
    ignoreDuplicateModules: string[]
    isBuild: boolean
    cspNonce: string
    preferScriptTags: boolean
    nodeModules: string[]
  }
}
