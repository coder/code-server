import { TSESTree } from '@typescript-eslint/types';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';
declare class FunctionNameDefinition extends DefinitionBase<DefinitionType.FunctionName, TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.TSDeclareFunction | TSESTree.TSEmptyBodyFunctionExpression, null, TSESTree.Identifier> {
    constructor(name: TSESTree.Identifier, node: FunctionNameDefinition['node']);
    readonly isTypeDefinition = false;
    readonly isVariableDefinition = true;
}
export { FunctionNameDefinition };
//# sourceMappingURL=FunctionNameDefinition.d.ts.map