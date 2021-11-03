import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class ClassScope extends ScopeBase<ScopeType.class, TSESTree.ClassDeclaration | TSESTree.ClassExpression, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: ClassScope['upper'], block: ClassScope['block']);
}
export { ClassScope };
//# sourceMappingURL=ClassScope.d.ts.map