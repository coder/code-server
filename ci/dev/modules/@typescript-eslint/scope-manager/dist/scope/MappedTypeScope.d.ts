import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class MappedTypeScope extends ScopeBase<ScopeType.mappedType, TSESTree.TSMappedType, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: MappedTypeScope['upper'], block: MappedTypeScope['block']);
}
export { MappedTypeScope };
//# sourceMappingURL=MappedTypeScope.d.ts.map