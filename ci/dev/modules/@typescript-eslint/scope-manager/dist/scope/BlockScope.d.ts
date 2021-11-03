import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class BlockScope extends ScopeBase<ScopeType.block, TSESTree.BlockStatement, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: BlockScope['upper'], block: BlockScope['block']);
}
export { BlockScope };
//# sourceMappingURL=BlockScope.d.ts.map