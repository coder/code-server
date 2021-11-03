import { Parser, ParserOptions } from "./Parser";
export { Parser, ParserOptions };
import { DomHandler, DomHandlerOptions, Node, Element } from "domhandler";
export { DomHandler, DomHandlerOptions };
declare type Options = ParserOptions & DomHandlerOptions;
/**
 * Parses data, returns the resulting DOM.
 *
 * @param data The data that should be parsed.
 * @param options Optional options for the parser and DOM builder.
 */
export declare function parseDOM(data: string, options?: Options): Node[];
/**
 * Creates a parser instance, with an attached DOM handler.
 *
 * @param cb A callback that will be called once parsing has been completed.
 * @param options Optional options for the parser and DOM builder.
 * @param elementCb An optional callback that will be called every time a tag has been completed inside of the DOM.
 */
export declare function createDomStream(cb: (error: Error | null, dom: Node[]) => void, options?: Options, elementCb?: (element: Element) => void): Parser;
export { default as Tokenizer } from "./Tokenizer";
import * as ElementType from "domelementtype";
export { ElementType };
/**
 * List of all events that the parser emits.
 *
 * Format: eventname: number of arguments.
 */
export declare const EVENTS: {
    attribute: number;
    cdatastart: number;
    cdataend: number;
    text: number;
    processinginstruction: number;
    comment: number;
    commentend: number;
    closetag: number;
    opentag: number;
    opentagname: number;
    error: number;
    end: number;
};
export * from "./FeedHandler";
export * from "./WritableStream";
export * from "./CollectingHandler";
import * as DomUtils from "domutils";
export { DomUtils };
export { DomHandler as DefaultHandler };
export { FeedHandler as RssHandler } from "./FeedHandler";
//# sourceMappingURL=index.d.ts.map