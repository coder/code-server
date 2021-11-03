import { ElementType } from "domelementtype";
/**
 * This object will be used as the prototype for Nodes when creating a
 * DOM-Level-1-compliant structure.
 */
export declare class Node {
    type: ElementType;
    /** Parent of the node */
    parent: NodeWithChildren | null;
    /** Previous sibling */
    prev: Node | null;
    /** Next sibling */
    next: Node | null;
    /** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
    startIndex: number | null;
    /** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
    endIndex: number | null;
    /**
     *
     * @param type The type of the node.
     */
    constructor(type: ElementType);
    get nodeType(): number;
    get parentNode(): NodeWithChildren | null;
    set parentNode(parent: NodeWithChildren | null);
    get previousSibling(): Node | null;
    set previousSibling(prev: Node | null);
    get nextSibling(): Node | null;
    set nextSibling(next: Node | null);
    /**
     * Clone this node, and optionally its children.
     *
     * @param recursive Clone child nodes as well.
     * @returns A clone of the node.
     */
    cloneNode<T extends Node>(this: T, recursive?: boolean): T;
}
export declare class DataNode extends Node {
    data: string;
    /**
     * @param type The type of the node
     * @param data The content of the data node
     */
    constructor(type: ElementType.Comment | ElementType.Text | ElementType.Directive, data: string);
    get nodeValue(): string;
    set nodeValue(data: string);
}
export declare class Text extends DataNode {
    constructor(data: string);
}
export declare class Comment extends DataNode {
    constructor(data: string);
}
export declare class ProcessingInstruction extends DataNode {
    name: string;
    constructor(name: string, data: string);
    "x-name"?: string;
    "x-publicId"?: string;
    "x-systemId"?: string;
}
/**
 * A `Node` that can have children.
 */
export declare class NodeWithChildren extends Node {
    children: Node[];
    /**
     * @param type Type of the node.
     * @param children Children of the node. Only certain node types can have children.
     */
    constructor(type: ElementType.Root | ElementType.CDATA | ElementType.Script | ElementType.Style | ElementType.Tag, children: Node[]);
    get firstChild(): Node | null;
    get lastChild(): Node | null;
    get childNodes(): Node[];
    set childNodes(children: Node[]);
}
export declare class Document extends NodeWithChildren {
    constructor(children: Node[]);
    "x-mode"?: "no-quirks" | "quirks" | "limited-quirks";
}
interface Attribute {
    name: string;
    value: string;
    namespace?: string;
    prefix?: string;
}
export declare class Element extends NodeWithChildren {
    name: string;
    attribs: {
        [name: string]: string;
    };
    /**
     * @param name Name of the tag, eg. `div`, `span`.
     * @param attribs Object mapping attribute names to attribute values.
     * @param children Children of the node.
     */
    constructor(name: string, attribs: {
        [name: string]: string;
    }, children?: Node[], type?: ElementType.Tag | ElementType.Script | ElementType.Style);
    get tagName(): string;
    set tagName(name: string);
    get attributes(): Attribute[];
    "x-attribsNamespace"?: Record<string, string>;
    "x-attribsPrefix"?: Record<string, string>;
}
/**
 * @param node Node to check.
 * @returns `true` if the node is a `Element`, `false` otherwise.
 */
export declare function isTag(node: Node): node is Element;
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `CDATA`, `false` otherwise.
 */
export declare function isCDATA(node: Node): node is NodeWithChildren;
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `Text`, `false` otherwise.
 */
export declare function isText(node: Node): node is DataNode;
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `Comment`, `false` otherwise.
 */
export declare function isComment(node: Node): node is DataNode;
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
 */
export declare function isDirective(node: Node): node is ProcessingInstruction;
/**
 * @param node Node to check.
 * @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
 */
export declare function isDocument(node: Node): node is Document;
/**
 * @param node Node to check.
 * @returns `true` if the node is a `NodeWithChildren` (has children), `false` otherwise.
 */
export declare function hasChildren(node: Node): node is NodeWithChildren;
/**
 * Clone a node, and optionally its children.
 *
 * @param recursive Clone child nodes as well.
 * @returns A clone of the node.
 */
export declare function cloneNode<T extends Node>(node: T, recursive?: boolean): T;
export {};
//# sourceMappingURL=node.d.ts.map