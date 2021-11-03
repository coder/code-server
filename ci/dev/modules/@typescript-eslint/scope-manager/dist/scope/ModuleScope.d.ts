import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class ModuleScope extends ScopeBase<ScopeType.module, TSESTree.Program, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: ModuleScope['upper'], block: ModuleScope['block']);
}
export { ModuleScope };
//# sourceMappingURL=ModuleScope.d.ts.map