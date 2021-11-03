import { TSESTree } from '@typescript-eslint/types';
import { Referencer } from './Referencer';
import { Visitor } from './Visitor';
declare type ExportNode = TSESTree.ExportAllDeclaration | TSESTree.ExportDefaultDeclaration | TSESTree.ExportNamedDeclaration;
declare class ExportVisitor extends Visitor {
    #private;
    constructor(node: ExportNode, referencer: Referencer);
    static visit(referencer: Referencer, node: ExportNode): void;
    protected Identifier(node: TSESTree.Identifier): void;
    protected ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration): void;
    protected ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration): void;
    protected ExportSpecifier(node: TSESTree.ExportSpecifier): void;
}
export { ExportVisitor };
//# sourceMappingURL=ExportVisitor.d.ts.map