import { TSESTree } from '@typescript-eslint/types';
import { VisitorBase, VisitorOptions } from './VisitorBase';
import { PatternVisitorCallback, PatternVisitorOptions } from './PatternVisitor';
interface VisitPatternOptions extends PatternVisitorOptions {
    processRightHandNodes?: boolean;
}
declare class Visitor extends VisitorBase {
    #private;
    constructor(optionsOrVisitor: VisitorOptions | Visitor);
    protected visitPattern(node: TSESTree.Node, callback: PatternVisitorCallback, options?: VisitPatternOptions): void;
}
export { Visitor, VisitorBase, VisitorOptions };
//# sourceMappingURL=Visitor.d.ts.map