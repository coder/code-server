import { TSESTree } from '@typescript-eslint/types';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';
declare class TypeDefinition extends DefinitionBase<DefinitionType.Type, TSESTree.TSInterfaceDeclaration | TSESTree.TSTypeAliasDeclaration | TSESTree.TSTypeParameter, null, TSESTree.Identifier> {
    constructor(name: TSESTree.Identifier, node: TypeDefinition['node']);
    readonly isTypeDefinition = true;
    readonly isVariableDefinition = false;
}
export { TypeDefinition };
//# sourceMappingURL=TypeDefinition.d.ts.map