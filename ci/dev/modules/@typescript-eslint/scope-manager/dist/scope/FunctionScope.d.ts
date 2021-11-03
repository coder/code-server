import { TSESTree } from '@typescript-eslint/types';
import { Scope } from './Scope';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { Reference } from '../referencer/Reference';
import { ScopeManager } from '../ScopeManager';
import { Variable } from '../variable';
declare class FunctionScope extends ScopeBase<ScopeType.function, TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.TSDeclareFunction | TSESTree.TSEmptyBodyFunctionExpression | TSESTree.Program, Scope> {
    constructor(scopeManager: ScopeManager, upperScope: FunctionScope['upper'], block: FunctionScope['block'], isMethodDefinition: boolean);
    protected isValidResolution(ref: Reference, variable: Variable): boolean;
}
export { FunctionScope };
//# sourceMappingURL=FunctionScope.d.ts.map