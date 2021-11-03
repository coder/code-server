import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class TSEnumScope extends ScopeBase<ScopeType.tsEnum, TSESTree.TSEnumDeclaration, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: TSEnumScope['upper'], block: TSEnumScope['block']);
}
export { TSEnumScope };
//# sourceMappingURL=TSEnumScope.d.ts.map