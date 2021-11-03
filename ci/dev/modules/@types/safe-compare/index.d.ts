// Type definitions for safe-compare 1.1
// Project: https://github.com/Bruce17/safe-compare#readme
// Definitions by: Vadim Belorussov <https://github.com/bevalorous>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export = safeCompare;

/**
 * Do a constant time string comparison. Always compare the complete strings
 * against each other to get a constant time. This method does not short-cut
 * if the two string's length differs.
 */
declare function safeCompare(a: string, b: string): boolean;
