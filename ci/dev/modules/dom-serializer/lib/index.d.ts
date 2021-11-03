import type { Node } from "domhandler";
export interface DomSerializerOptions {
    emptyAttrs?: boolean;
    selfClosingTags?: boolean;
    xmlMode?: boolean | "foreign";
    decodeEntities?: boolean;
}
/**
 * Renders a DOM node or an array of DOM nodes to a string.
 *
 * Can be thought of as the equivalent of the `outerHTML` of the passed node(s).
 *
 * @param node Node to be rendered.
 * @param options Changes serialization behavior
 */
export default function render(node: Node | Node[], options?: DomSerializerOptions): string;
//# sourceMappingURL=index.d.ts.map