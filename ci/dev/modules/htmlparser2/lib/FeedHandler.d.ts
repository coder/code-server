import DomHandler, { DomHandlerOptions } from "domhandler";
import { ParserOptions } from "./Parser";
interface FeedItem {
    id?: string;
    title?: string;
    link?: string;
    description?: string;
    pubDate?: Date;
}
interface Feed {
    type?: string;
    id?: string;
    title?: string;
    link?: string;
    description?: string;
    updated?: Date;
    author?: string;
    items?: FeedItem[];
}
export declare class FeedHandler extends DomHandler {
    feed?: Feed;
    /**
     *
     * @param callback
     * @param options
     */
    constructor(callback?: ((error: Error | null) => void) | DomHandlerOptions, options?: DomHandlerOptions);
    onend(): void;
}
/**
 * Parse a feed.
 *
 * @param feed The feed that should be parsed, as a string.
 * @param options Optionally, options for parsing. When using this option, you probably want to set `xmlMode` to `true`.
 */
export declare function parseFeed(feed: string, options?: ParserOptions & DomHandlerOptions): Feed | undefined;
export {};
//# sourceMappingURL=FeedHandler.d.ts.map