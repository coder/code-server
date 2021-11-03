import { LangVariant, Node, Pos } from 'mvdan-sh';
import { ParserOptions, Plugin, RequiredOptions } from 'prettier';
export interface ShOptions extends RequiredOptions {
    keepComments: boolean;
    stopAt: string;
    variant: LangVariant;
    indent: number;
    binaryNextLine: boolean;
    switchCaseIndent: boolean;
    spaceRedirects: boolean;
    keepPadding: boolean;
    minify: boolean;
    functionNextLine: boolean;
}
export declare type ShParserOptions = ParserOptions<Node> & ShOptions;
export interface ShParseError {
    Filename: string;
    Pos: Pos;
    Text: string;
    Incomplete: boolean;
    Error(): void;
}
declare const ShPlugin: Plugin<Node>;
export default ShPlugin;
