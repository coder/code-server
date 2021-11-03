import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class CatchScope extends ScopeBase<ScopeType.catch, TSESTree.CatchClause, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: CatchScope['upper'], block: CatchScope['block']);
}
export { CatchScope };
//# sourceMappingURL=CatchScope.d.ts.map