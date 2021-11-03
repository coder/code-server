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
