import { TSESTree } from '@typescript-eslint/types';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { Scope } from './Scope';
import { ScopeManager } from '../ScopeManager';
declare class FunctionExpressionNameScope extends ScopeBase<ScopeType.functionExpressionName, TSESTree.FunctionExpression, Scope> {
    readonly functionExpressionScope: true;
    constructor(scopeManager: ScopeManager, upperScope: FunctionExpressionNameScope['upper'], block: FunctionExpressionNameScope['block']);
}
export { FunctionExpressionNameScope };
//# sourceMappingURL=FunctionExpressionNameScope.d.ts.map