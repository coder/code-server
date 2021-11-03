import { TSESTree } from '@typescript-eslint/types';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';
declare class ImplicitGlobalVariableDefinition extends DefinitionBase<DefinitionType.ImplicitGlobalVariable, TSESTree.Node, null, TSESTree.BindingName> {
    constructor(name: TSESTree.BindingName, node: ImplicitGlobalVariableDefinition['node']);
    readonly isTypeDefinition = false;
    readonly isVariableDefinition = true;
}
export { ImplicitGlobalVariableDefinition };
//# sourceMappingURL=ImplicitGlobalVariableDefinition.d.ts.map