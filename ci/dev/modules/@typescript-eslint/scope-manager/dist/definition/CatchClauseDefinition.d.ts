import { TSESTree } from '@typescript-eslint/types';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';
declare class CatchClauseDefinition extends DefinitionBase<DefinitionType.CatchClause, TSESTree.CatchClause, null, TSESTree.BindingName> {
    constructor(name: TSESTree.BindingName, node: CatchClauseDefinition['node']);
    readonly isTypeDefinition = false;
    readonly isVariableDefinition = true;
}
export { CatchClauseDefinition };
//# sourceMappingURL=CatchClauseDefinition.d.ts.map