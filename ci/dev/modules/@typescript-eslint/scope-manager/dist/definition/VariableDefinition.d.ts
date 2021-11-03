import { TSESTree } from '@typescript-eslint/types';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';
declare class VariableDefinition extends DefinitionBase<DefinitionType.Variable, TSESTree.VariableDeclarator, TSESTree.VariableDeclaration, TSESTree.Identifier> {
    constructor(name: TSESTree.Identifier, node: VariableDefinition['node'], decl: TSESTree.VariableDeclaration);
    readonly isTypeDefinition = false;
    readonly isVariableDefinition = true;
}
export { VariableDefinition };
//# sourceMappingURL=VariableDefinition.d.ts.map