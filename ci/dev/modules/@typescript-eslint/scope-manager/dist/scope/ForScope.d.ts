import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class ForScope extends ScopeBase<ScopeType.for, TSESTree.ForInStatement | TSESTree.ForOfStatement | TSESTree.ForStatement, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: ForScope['upper'], block: ForScope['block']);
}
export { ForScope };
//# sourceMappingURL=ForScope.d.ts.map