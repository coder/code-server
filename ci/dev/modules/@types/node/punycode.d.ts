/**
 * @deprecated since v7.0.0
 * The version of the punycode module bundled in Node.js is being deprecated.
 * In a future major version of Node.js this module will be removed.
 * Users currently depending on the punycode module should switch to using
 * the userland-provided Punycode.js module instead.
 */
declare module 'punycode' {
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    function decode(string: string): string;
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    function encode(string: string): string;
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    function toUnicode(domain: string): string;
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    function toASCII(domain: string): string;
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    const ucs2: ucs2;
    interface ucs2 {
        /**
         * @deprecated since v7.0.0
         * The version of the punycode module bundled in Node.js is being deprecated.
         * In a future major version of Node.js this module will be removed.
         * Users currently depending on the punycode module should switch to using
         * the userland-provided Punycode.js module instead.
         */
        decode(string: string): number[];
        /**
         * @deprecated since v7.0.0
         * The version of the punycode module bundled in Node.js is being deprecated.
         * In a future major version of Node.js this module will be removed.
         * Users currently depending on the punycode module should switch to using
         * the userland-provided Punycode.js module instead.
         */
        encode(codePoints: ReadonlyArray<number>): string;
    }
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    const version: string;
}
