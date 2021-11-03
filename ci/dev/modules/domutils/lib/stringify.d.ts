import { Node } from "domhandler";
import { DomSerializerOptions } from "dom-serializer";
/**
 * @param node Node to get the outer HTML of.
 * @param options Options for serialization.
 * @deprecated Use the `dom-serializer` module directly.
 * @returns `node`'s outer HTML.
 */
export declare function getOuterHTML(node: Node | Node[], options?: DomSerializerOptions): string;
/**
 * @param node Node to get the inner HTML of.
 * @param options Options for serialization.
 * @deprecated Use the `dom-serializer` module directly.
 * @returns `node`'s inner HTML.
 */
export declare function getInnerHTML(node: Node, options?: DomSerializerOptions): string;
/**
 * Get a node's inner text.
 *
 * @param node Node to get the inner text of.
 * @returns `node`'s inner text.
 */
export declare function getText(node: Node | Node[]): string;
//# sourceMappingURL=stringify.d.ts.map