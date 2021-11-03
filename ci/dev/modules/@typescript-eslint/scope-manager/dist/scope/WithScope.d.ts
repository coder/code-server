import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class WithScope extends ScopeBase<ScopeType.with, TSESTree.WithStatement, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: WithScope['upper'], block: WithScope['block']);
    close(scopeManager: ScopeManager): Scope | null;
}
export { WithScope };
//# sourceMappingURL=WithScope.d.ts.map