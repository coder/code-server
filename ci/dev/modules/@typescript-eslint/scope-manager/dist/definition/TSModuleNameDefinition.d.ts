import { TSESTree } from '@typescript-eslint/types';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';
declare class TSModuleNameDefinition extends DefinitionBase<DefinitionType.TSModuleName, TSESTree.TSModuleDeclaration, null, TSESTree.Identifier> {
    constructor(name: TSESTree.Identifier, node: TSModuleNameDefinition['node']);
    readonly isTypeDefinition = true;
    readonly isVariableDefinition = true;
}
export { TSModuleNameDefinition };
//# sourceMappingURL=TSModuleNameDefinition.d.ts.map