import { TSESTree } from '@typescript-eslint/types';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';
declare class TSEnumMemberDefinition extends DefinitionBase<DefinitionType.TSEnumMember, TSESTree.TSEnumMember, null, TSESTree.Identifier | TSESTree.StringLiteral> {
    constructor(name: TSESTree.Identifier | TSESTree.StringLiteral, node: TSEnumMemberDefinition['node']);
    readonly isTypeDefinition = true;
    readonly isVariableDefinition = true;
}
export { TSEnumMemberDefinition };
//# sourceMappingURL=TSEnumMemberDefinition.d.ts.map