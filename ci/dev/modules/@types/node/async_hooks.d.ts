/**
 * Async Hooks module: https://nodejs.org/api/async_hooks.html
 */
declare module 'async_hooks' {
    /**
     * Returns the asyncId of the current execution context.
     */
    function executionAsyncId(): number;

    /**
     * The resource representing the current execution.
     *  Useful to store data within the resource.
     *
     * Resource objects returned by `executionAsyncResource()` are most often internal
     * Node.js handle objects with undocumented APIs. Using any functions or properties
     * on the object is likely to crash your application and should be avoided.
     *
     * Using `executionAsyncResource()` in the top-level execution context will
     * return an empty object as there is no handle or request object to use,
     * but having an object representing the top-level can be helpful.
     */
    function executionAsyncResource(): object;

    /**
     * Returns the ID of the resource responsible for calling the callback that is currently being executed.
     */
    function triggerAsyncId(): number;

    interface HookCallbacks {
        /**
         * Called when a class is constructed that has the possibility to emit an asynchronous event.
         * @param asyncId a unique ID for the async resource
         * @param type the type of the async resource
         * @param triggerAsyncId the unique ID of the async resource in whose execution context this async resource was created
         * @param resource reference to the resource representing the async operation, needs to be released during destroy
         */
        init?(asyncId: number, type: string, triggerAsyncId: number, resource: object): void;

        /**
         * When an asynchronous operation is initiated or completes a callback is called to notify the user.
         * The before callback is called just before said callback is executed.
         * @param asyncId the unique identifier assigned to the resource about to execute the callback.
         */
        before?(asyncId: number): void;

        /**
         * Called immediately after the callback specified in before is completed.
         * @param asyncId the unique identifier assigned to the resource which has executed the callback.
         */
        after?(asyncId: number): void;

        /**
         * Called when a promise has resolve() called. This may not be in the same execution id
         * as the promise itself.
         * @param asyncId the unique id for the promise that was resolve()d.
         */
        promiseResolve?(asyncId: number): void;

        /**
         * Called after the resource corresponding to asyncId is destroyed
         * @param asyncId a unique ID for the async resource
         */
        destroy?(asyncId: number): void;
    }

    interface AsyncHook {
        /**
         * Enable the callbacks for a given AsyncHook instance. If no callbacks are provided enabling is a noop.
         */
        enable(): this;

        /**
         * Disable the callbacks for a given AsyncHook instance from the global pool of AsyncHook callbacks to be executed. Once a hook has been disabled it will not be called again until enabled.
         */
        disable(): this;
    }

    /**
     * Registers functions to be called for different lifetime events of each async operation.
     * @param options the callbacks to register
     * @return an AsyncHooks instance used for disabling and enabling hooks
     */
    function createHook(options: HookCallbacks): AsyncHook;

    interface AsyncResourceOptions {
      /**
       * The ID of the execution context that created this async event.
       * @default executionAsyncId()
       */
      triggerAsyncId?: number | undefined;

      /**
       * Disables automatic `emitDestroy` when the object is garbage collected.
       * This usually does not need to be set (even if `emitDestroy` is called
       * manually), unless the resource's `asyncId` is retrieved and the
       * sensitive API's `emitDestroy` is called with it.
       * @default false
       */
      requireManualDestroy?: boolean | undefined;
    }

    /**
     * The class AsyncResource was designed to be extended by the embedder's async resources.
     * Using this users can easily trigger the lifetime events of their own resources.
     */
    class AsyncResource {
        /**
         * AsyncResource() is meant to be extended. Instantiating a
         * new AsyncResource() also triggers init. If triggerAsyncId is omitted then
         * async_hook.executionAsyncId() is used.
         * @param type The type of async event.
         * @param triggerAsyncId The ID of the execution context that created
         *   this async event (default: `executionAsyncId()`), or an
         *   AsyncResourceOptions object (since 9.3)
         */
        constructor(type: string, triggerAsyncId?: number|AsyncResourceOptions);

        /**
         * Binds the given function to the current execution context.
         * @param fn The function to bind to the current execution context.
         * @param type An optional name to associate with the underlying `AsyncResource`.
         */
        static bind<Func extends (...args: any[]) => any>(fn: Func, type?: string): Func & { asyncResource: AsyncResource };

        /**
         * Binds the given function to execute to this `AsyncResource`'s scope.
         * @param fn The function to bind to the current `AsyncResource`.
         */
        bind<Func extends (...args: any[]) => any>(fn: Func): Func & { asyncResource: AsyncResource };

        /**
         * Call the provided function with the provided arguments in the
         * execution context of the async resource. This will establish the
         * context, trigger the AsyncHooks before callbacks, call the function,
         * trigger the AsyncHooks after callbacks, and then restore the original
         * execution context.
         * @param fn The function to call in the execution context of this
         *   async resource.
         * @param thisArg The receiver to be used for the function call.
         * @param args Optional arguments to pass to the function.
         */
        runInAsyncScope<This, Result>(fn: (this: This, ...args: any[]) => Result, thisArg?: This, ...args: any[]): Result;

        /**
         * Call AsyncHooks destroy callbacks.
         */
        emitDestroy(): this;

        /**
         * @return the unique ID assigned to this AsyncResource instance.
         */
        asyncId(): number;

        /**
         * @return the trigger ID for this AsyncResource instance.
         */
        triggerAsyncId(): number;
    }

    /**
     * When having multiple instances of `AsyncLocalStorage`, they are independent
     * from each other. It is safe to instantiate this class multiple times.
     */
    class AsyncLocalStorage<T> {
        /**
         * This method disables the instance of `AsyncLocalStorage`. All subsequent calls
         * to `asyncLocalStorage.getStore()` will return `undefined` until
         * `asyncLocalStorage.run()` is called again.
         *
         * When calling `asyncLocalStorage.disable()`, all current contexts linked to the
         * instance will be exited.
         *
         * Calling `asyncLocalStorage.disable()` is required before the
         * `asyncLocalStorage` can be garbage collected. This does not apply to stores
         * provided by the `asyncLocalStorage`, as those objects are garbage collected
         * along with the corresponding async resources.
         *
         * This method is to be used when the `asyncLocalStorage` is not in use anymore
         * in the current process.
         */
        disable(): void;

        /**
         * This method returns the current store. If this method is called outside of an
         * asynchronous context initialized by calling `asyncLocalStorage.run`, it will
         * return `undefined`.
         */
        getStore(): T | undefined;

        /**
         * This methods runs a function synchronously within a context and return its
         * return value. The store is not accessible outside of the callback function or
         * the asynchronous operations created within the callback.
         *
         * Optionally, arguments can be passed to the function. They will be passed to the
         * callback function.
         *
         * I the callback function throws an error, it will be thrown by `run` too. The
         * stacktrace will not be impacted by this call and the context will be exited.
         */
        // TODO: Apply generic vararg once available
        run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R;

        /**
         * This methods runs a function synchronously outside of a context and return its
         * return value. The store is not accessible within the callback function or the
         * asynchronous operations created within the callback.
         *
         * Optionally, arguments can be passed to the function. They will be passed to the
         * callback function.
         *
         * If the callback function throws an error, it will be thrown by `exit` too. The
         * stacktrace will not be impacted by this call and the context will be
         * re-entered.
         */
        // TODO: Apply generic vararg once available
        exit<R>(callback: (...args: any[]) => R, ...args: any[]): R;

        /**
         * Calling `asyncLocalStorage.enterWith(store)` will transition into the context
         * for the remainder of the current synchronous execution and will persist
         * through any following asynchronous calls.
         */
        enterWith(store: T): void;
    }
}
