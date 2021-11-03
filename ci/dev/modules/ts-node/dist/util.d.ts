/**
 * Cached fs operation wrapper.
 */
export declare function cachedLookup<T, R>(fn: (arg: T) => R): (arg: T) => R;
/**
 * We do not support ts's `trace` option yet.  In the meantime, rather than omit
 * `trace` options in hosts, I am using this placeholder.
 */
export declare function trace(s: string): void;
