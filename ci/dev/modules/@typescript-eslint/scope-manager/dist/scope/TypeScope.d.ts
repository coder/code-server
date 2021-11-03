import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';
declare class TypeScope extends ScopeBase<ScopeType.type, TSESTree.TSInterfaceDeclaration | TSESTree.TSTypeAliasDeclaration, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: TypeScope['upper'], block: TypeScope['block']);
}
export { TypeScope };
//# sourceMappingURL=TypeScope.d.ts.map