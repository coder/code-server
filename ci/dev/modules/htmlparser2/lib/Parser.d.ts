/// <reference types="node" />
import Tokenizer from "./Tokenizer";
import { EventEmitter } from "events";
export interface ParserOptions {
    /***
     * Indicates whether special tags (<script> and <style>) should get special treatment
     * and if "empty" tags (eg. <br>) can have children.  If `false`, the content of special tags
     * will be text only. For feeds and other XML content (documents that don't consist of HTML),
     * set this to `true`. Default: `false`.
     */
    xmlMode?: boolean;
    /***
     * If set to true, entities within the document will be decoded. Defaults to `false`.
     */
    decodeEntities?: boolean;
    /***
     * If set to true, all tags will be lowercased. If xmlMode is disabled, this defaults to `true`.
     */
    lowerCaseTags?: boolean;
    /***
     * If set to `true`, all attribute names will be lowercased. This has noticeable impact on speed, so it defaults to `false`.
     */
    lowerCaseAttributeNames?: boolean;
    /***
     * If set to true, CDATA sections will be recognized as text even if the xmlMode option is not enabled.
     * NOTE: If xmlMode is set to `true` then CDATA sections will always be recognized as text.
     */
    recognizeCDATA?: boolean;
    /***
     * If set to `true`, self-closing tags will trigger the onclosetag event even if xmlMode is not set to `true`.
     * NOTE: If xmlMode is set to `true` then self-closing tags will always be recognized.
     */
    recognizeSelfClosing?: boolean;
    /**
     * Allows the default tokenizer to be overwritten.
     */
    Tokenizer?: typeof Tokenizer;
}
export interface Handler {
    onparserinit(parser: Parser): void;
    /***
     * Resets the handler back to starting state
     */
    onreset(): void;
    /***
     * Signals the handler that parsing is done
     */
    onend(): void;
    onerror(error: Error): void;
    onclosetag(name: string): void;
    onopentagname(name: string): void;
    onattribute(name: string, value: string): void;
    onopentag(name: string, attribs: {
        [s: string]: string;
    }): void;
    ontext(data: string): void;
    oncomment(data: string): void;
    oncdatastart(): void;
    oncdataend(): void;
    oncommentend(): void;
    onprocessinginstruction(name: string, data: string): void;
}
export declare class Parser extends EventEmitter {
    _tagname: string;
    _attribname: string;
    _attribvalue: string;
    _attribs: null | {
        [key: string]: string;
    };
    _stack: string[];
    _foreignContext: boolean[];
    startIndex: number;
    endIndex: number | null;
    _cbs: Partial<Handler>;
    _options: ParserOptions;
    _lowerCaseTagNames: boolean;
    _lowerCaseAttributeNames: boolean;
    _tokenizer: Tokenizer;
    constructor(cbs: Partial<Handler> | null, options?: ParserOptions);
    _updatePosition(initialOffset: number): void;
    ontext(data: string): void;
    onopentagname(name: string): void;
    onopentagend(): void;
    onclosetag(name: string): void;
    onselfclosingtag(): void;
    _closeCurrentTag(): void;
    onattribname(name: string): void;
    onattribdata(value: string): void;
    onattribend(): void;
    _getInstructionName(value: string): string;
    ondeclaration(value: string): void;
    onprocessinginstruction(value: string): void;
    oncomment(value: string): void;
    oncdata(value: string): void;
    onerror(err: Error): void;
    onend(): void;
    reset(): void;
    parseComplete(data: string): void;
    write(chunk: string): void;
    end(chunk?: string): void;
    pause(): void;
    resume(): void;
    parseChunk: (chunk: string) => void;
    done: (chunk?: string | undefined) => void;
}
//# sourceMappingURL=Parser.d.ts.map