import { TSESTree } from '@typescript-eslint/types';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';
declare class TSEnumNameDefinition extends DefinitionBase<DefinitionType.TSEnumName, TSESTree.TSEnumDeclaration, null, TSESTree.Identifier> {
    constructor(name: TSESTree.Identifier, node: TSEnumNameDefinition['node']);
    readonly isTypeDefinition = true;
    readonly isVariableDefinition = true;
}
export { TSEnumNameDefinition };
//# sourceMappingURL=TSEnumNameDefinition.d.ts.map