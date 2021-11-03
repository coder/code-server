// MIT © 2017 azu
"use strict";

/**
 * AST Node types list on TxtNode.
 * Constant value of types
 * @see https://github.com/textlint/textlint/blob/master/docs/txtnode.md
 */
import { TypeofTxtNode } from "./TypeofTxtNode";

export enum ASTNodeTypes {
    Document = "Document",
    DocumentExit = "Document:exit",
    Paragraph = "Paragraph",
    ParagraphExit = "Paragraph:exit",
    BlockQuote = "BlockQuote",
    BlockQuoteExit = "BlockQuote:exit",
    ListItem = "ListItem",
    ListItemExit = "ListItem:exit",
    List = "List",
    ListExit = "List:exit",
    Header = "Header",
    HeaderExit = "Header:exit",
    CodeBlock = "CodeBlock",
    CodeBlockExit = "CodeBlock:exit",
    HtmlBlock = "HtmlBlock",
    HtmlBlockExit = "HtmlBlock:exit",
    HorizontalRule = "HorizontalRule",
    HorizontalRuleExit = "HorizontalRule:exit",
    Comment = "Comment",
    CommentExit = "Comment:exit",
    /**
     * @deprecated
     */
    ReferenceDef = "ReferenceDef",
    /**
     * @deprecated
     */
    ReferenceDefExit = "ReferenceDef:exit",
    // inline
    Str = "Str",
    StrExit = "Str:exit",
    Break = "Break", // well-known Hard Break
    BreakExit = "Break:exit", // well-known Hard Break
    Emphasis = "Emphasis",
    EmphasisExit = "Emphasis:exit",
    Strong = "Strong",
    StrongExit = "Strong:exit",
    Html = "Html",
    HtmlExit = "Html:exit",
    Link = "Link",
    LinkExit = "Link:exit",
    Image = "Image",
    ImageExit = "Image:exit",
    Code = "Code",
    CodeExit = "Code:exit",
    Delete = "Delete",
    DeleteExit = "Delete:exit"
}

/**
 * Key of ASTNodeTypes or any string
 * For example, TxtNodeType is "Document".
 */
export type TxtNodeType = keyof typeof ASTNodeTypes | string;

/**
 * Type utility for TxtNodeType
 * Return TxtNode interface for the TxtNodeTYpe
 */
export { TypeofTxtNode };

/**
 * Any TxtNode types
 */
export type AnyTxtNode = TxtNode | TxtTextNode | TxtParentNode;

/**
 * Basic TxtNode
 * Probably, Real TxtNode implementation has more properties.
 */
export interface TxtNode {
    type: TxtNodeType;
    raw: string;
    range: TextNodeRange;
    loc: TxtNodeLineLocation;
    // parent is runtime information
    // Not need in AST
    // For example, top Root Node like `Document` has not parent.
    parent?: TxtNode;

    [index: string]: any;
}

/**
 * Location
 */
export interface TxtNodeLineLocation {
    start: TxtNodePosition;
    end: TxtNodePosition;
}

/**
 * Position's line start with 1.
 * Position's column start with 0.
 * This is for compatibility with JavaScript AST.
 * https://gist.github.com/azu/8866b2cb9b7a933e01fe
 */
export interface TxtNodePosition {
    line: number; // start with 1
    column: number; // start with 0
}

/**
 * Range start with 0
 */
export type TextNodeRange = [number, number];

/**
 * Text Node.
 * Text Node has inline value.
 * For example, `Str` Node is an TxtTextNode.
 */
export interface TxtTextNode extends TxtNode {
    value: string;
}

/**
 * Parent Node.
 * Parent Node has children that are consist of TxtNode or TxtTextNode
 */
export interface TxtParentNode extends TxtNode {
    children: Array<TxtNode | TxtTextNode>;
}
