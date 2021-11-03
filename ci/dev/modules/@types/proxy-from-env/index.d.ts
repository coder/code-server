// Type definitions for proxy-from-env 1.0
// Project: https://github.com/Rob--W/proxy-from-env#readme
// Definitions by: JasonHK <https://github.com/JasonHK>
//                 FloPes <https://github.com/flopes89>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference types="node" />

import { Url } from "url";

/**
 * Takes an input URL and returns the desired proxy URL. If no proxy is set, an
 * empty string is returned.
 * @param url The URL
 * @returns The URL of the proxy that should handle the request to the given
 *          URL.
 */
export function getProxyForUrl(url: string|Url): string;
