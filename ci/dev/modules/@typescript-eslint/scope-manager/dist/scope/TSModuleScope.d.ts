import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class TSModuleScope extends ScopeBase<ScopeType.tsModule, TSESTree.TSModuleDeclaration, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: TSModuleScope['upper'], block: TSModuleScope['block']);
}
export { TSModuleScope };
//# sourceMappingURL=TSModuleScope.d.ts.map