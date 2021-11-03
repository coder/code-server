import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class ConditionalTypeScope extends ScopeBase<ScopeType.conditionalType, TSESTree.TSConditionalType, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: ConditionalTypeScope['upper'], block: ConditionalTypeScope['block']);
}
export { ConditionalTypeScope };
//# sourceMappingURL=ConditionalTypeScope.d.ts.map