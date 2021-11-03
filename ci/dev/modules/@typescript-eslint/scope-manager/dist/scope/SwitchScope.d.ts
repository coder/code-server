import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class SwitchScope extends ScopeBase<ScopeType.switch, TSESTree.SwitchStatement, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: SwitchScope['upper'], block: SwitchScope['block']);
}
export { SwitchScope };
//# sourceMappingURL=SwitchScope.d.ts.map