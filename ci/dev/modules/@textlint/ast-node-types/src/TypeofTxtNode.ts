import { ASTNodeTypes, TxtNode, TxtParentNode, TxtTextNode } from "./index";
/**
 * Return TxtNode type of ASTNodeTypes | string
 *
 * @example
 * ```
 * type NodeType = TxtNodeTypeOfNode<ASTNodeTypes.Document>;
 */
export type TypeofTxtNode<T extends ASTNodeTypes | string> =
    // Root
    T extends ASTNodeTypes.Document
        ? TxtParentNode
        : T extends ASTNodeTypes.DocumentExit
        ? TxtParentNode // Paragraph Str.
        : T extends ASTNodeTypes.Paragraph
        ? TxtParentNode
        : T extends ASTNodeTypes.ParagraphExit
        ? TxtParentNode // > Str
        : T extends ASTNodeTypes.BlockQuote
        ? TxtParentNode
        : T extends ASTNodeTypes.BlockQuoteExit
        ? TxtParentNode // - item
        : T extends ASTNodeTypes.List
        ? TxtParentNode
        : T extends ASTNodeTypes.ListExit
        ? TxtParentNode // - item
        : T extends ASTNodeTypes.ListItem
        ? TxtParentNode
        : T extends ASTNodeTypes.ListItemExit
        ? TxtParentNode // # Str
        : T extends ASTNodeTypes.Header
        ? TxtParentNode
        : T extends ASTNodeTypes.HeaderExit
        ? TxtParentNode
        : /* ```
         * code
         * ```
         */
        T extends ASTNodeTypes.CodeBlock
        ? TxtParentNode
        : T extends ASTNodeTypes.CodeBlockExit
        ? TxtParentNode // <div>\n</div>
        : T extends ASTNodeTypes.HtmlBlock
        ? TxtParentNode
        : T extends ASTNodeTypes.HtmlBlockExit
        ? TxtParentNode // [link](https://example.com)
        : T extends ASTNodeTypes.Link
        ? TxtParentNode
        : T extends ASTNodeTypes.LinkExit
        ? TxtParentNode // ~~Str~~
        : T extends ASTNodeTypes.Delete
        ? TxtParentNode
        : T extends ASTNodeTypes.DeleteExit
        ? TxtParentNode // *Str*
        : T extends ASTNodeTypes.Emphasis
        ? TxtParentNode
        : T extends ASTNodeTypes.EmphasisExit
        ? TxtParentNode // __Str__
        : T extends ASTNodeTypes.Strong
        ? TxtParentNode
        : T extends ASTNodeTypes.StrongExit
        ? TxtParentNode // Str<space><space>
        : T extends ASTNodeTypes.Break
        ? TxtNode
        : T extends ASTNodeTypes.BreakExit
        ? TxtNode // ![alt](https://example.com/img)
        : T extends ASTNodeTypes.Image
        ? TxtNode
        : T extends ASTNodeTypes.ImageExit
        ? TxtNode // ----
        : T extends ASTNodeTypes.HorizontalRule
        ? TxtNode
        : T extends ASTNodeTypes.HorizontalRuleExit
        ? TxtNode // <!-- Str -->
        : T extends ASTNodeTypes.Comment
        ? TxtTextNode
        : T extends ASTNodeTypes.CommentExit
        ? TxtTextNode // Str
        : T extends ASTNodeTypes.Str
        ? TxtTextNode
        : T extends ASTNodeTypes.StrExit
        ? TxtTextNode // `code`
        : T extends ASTNodeTypes.Code
        ? TxtTextNode
        : T extends ASTNodeTypes.CodeExit
        ? TxtTextNode // <span>Str</span>
        : T extends ASTNodeTypes.Html
        ? TxtTextNode
        : T extends ASTNodeTypes.HtmlExit
        ? TxtTextNode
        : any;
