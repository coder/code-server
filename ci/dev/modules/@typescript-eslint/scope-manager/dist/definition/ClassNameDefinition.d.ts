import { TSESTree } from '@typescript-eslint/types';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';
declare class ClassNameDefinition extends DefinitionBase<DefinitionType.ClassName, TSESTree.ClassDeclaration | TSESTree.ClassExpression, null, TSESTree.Identifier> {
    constructor(name: TSESTree.Identifier, node: ClassNameDefinition['node']);
    readonly isTypeDefinition = true;
    readonly isVariableDefinition = true;
}
export { ClassNameDefinition };
//# sourceMappingURL=ClassNameDefinition.d.ts.map