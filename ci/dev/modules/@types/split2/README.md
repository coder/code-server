# Installation
> `npm install --save @types/split2`

# Summary
This package contains type definitions for split2 (https://github.com/mcollina/split2).

# Details
Files were exported from https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/split2.
## [index.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/split2/index.d.ts)
````ts
// Type definitions for split2 3.2
// Project: https://github.com/mcollina/split2
// Definitions by: TANAKA Koichi <https://github.com/mugeso>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference types="node" />

import { Transform, TransformOptions } from "stream";

declare function split(matcher: split.Matcher, Mapper: split.Mapper, options?: split.Options): Transform;
declare function split(mapper: split.Mapper, options?: split.Options): Transform;
// tslint:disable-next-line unified-signatures
declare function split(matcher: split.Matcher, options?: split.Options): Transform;
declare function split(options?: split.Options): Transform;

declare namespace split {
    interface Mapper {
        (line: string): any;
    }

    interface Options extends TransformOptions {
        maxLength?: number | undefined;
    }
    type Matcher = string | RegExp;
}

export = split;

````

### Additional Details
 * Last updated: Tue, 06 Jul 2021 16:35:11 GMT
 * Dependencies: [@types/node](https://npmjs.com/package/@types/node)
 * Global values: none

# Credits
These definitions were written by [TANAKA Koichi](https://github.com/mugeso).
