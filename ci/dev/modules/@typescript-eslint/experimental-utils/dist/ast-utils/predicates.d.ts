import { TSESTree } from '../ts-estree';
declare function isOptionalChainPunctuator(token: TSESTree.Token): token is TSESTree.PunctuatorToken & {
    value: '?.';
};
declare function isNotOptionalChainPunctuator(token: TSESTree.Token): token is Exclude<TSESTree.Token, TSESTree.PunctuatorToken & {
    value: '?.';
}>;
declare function isNonNullAssertionPunctuator(token: TSESTree.Token): token is TSESTree.PunctuatorToken & {
    value: '!';
};
declare function isNotNonNullAssertionPunctuator(token: TSESTree.Token): token is Exclude<TSESTree.Token, TSESTree.PunctuatorToken & {
    value: '!';
}>;
/**
 * Returns true if and only if the node represents: foo?.() or foo.bar?.()
 */
declare function isOptionalCallExpression(node: TSESTree.Node): node is TSESTree.CallExpression & {
    optional: true;
};
/**
 * Returns true if and only if the node represents logical OR
 */
declare function isLogicalOrOperator(node: TSESTree.Node): node is TSESTree.LogicalExpression & {
    operator: '||';
};
/**
 * Checks if a node is a type assertion:
 * ```
 * x as foo
 * <foo>x
 * ```
 */
declare function isTypeAssertion(node: TSESTree.Node | undefined | null): node is TSESTree.TSAsExpression | TSESTree.TSTypeAssertion;
declare function isVariableDeclarator(node: TSESTree.Node | undefined): node is TSESTree.VariableDeclarator;
declare function isFunction(node: TSESTree.Node | undefined): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;
declare function isFunctionType(node: TSESTree.Node | undefined): node is TSESTree.TSCallSignatureDeclaration | TSESTree.TSConstructorType | TSESTree.TSConstructSignatureDeclaration | TSESTree.TSEmptyBodyFunctionExpression | TSESTree.TSFunctionType | TSESTree.TSMethodSignature;
declare function isFunctionOrFunctionType(node: TSESTree.Node | undefined): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.TSCallSignatureDeclaration | TSESTree.TSConstructorType | TSESTree.TSConstructSignatureDeclaration | TSESTree.TSEmptyBodyFunctionExpression | TSESTree.TSFunctionType | TSESTree.TSMethodSignature;
declare function isTSFunctionType(node: TSESTree.Node | undefined): node is TSESTree.TSFunctionType;
declare function isTSConstructorType(node: TSESTree.Node | undefined): node is TSESTree.TSConstructorType;
declare function isClassOrTypeElement(node: TSESTree.Node | undefined): node is TSESTree.ClassElement | TSESTree.TypeElement;
/**
 * Checks if a node is a constructor method.
 */
declare function isConstructor(node: TSESTree.Node | undefined): node is TSESTree.MethodDefinition;
/**
 * Checks if a node is a setter method.
 */
declare function isSetter(node: TSESTree.Node | undefined): node is TSESTree.MethodDefinition | TSESTree.Property;
declare function isIdentifier(node: TSESTree.Node | undefined): node is TSESTree.Identifier;
/**
 * Checks if a node represents an `await …` expression.
 */
declare function isAwaitExpression(node: TSESTree.Node | undefined | null): node is TSESTree.AwaitExpression;
/**
 * Checks if a possible token is the `await` keyword.
 */
declare function isAwaitKeyword(node: TSESTree.Token | undefined | null): node is TSESTree.IdentifierToken & {
    value: 'await';
};
declare function isLoop(node: TSESTree.Node | undefined | null): node is TSESTree.DoWhileStatement | TSESTree.ForStatement | TSESTree.ForInStatement | TSESTree.ForOfStatement | TSESTree.WhileStatement;
export { isAwaitExpression, isAwaitKeyword, isConstructor, isClassOrTypeElement, isFunction, isFunctionOrFunctionType, isFunctionType, isIdentifier, isLoop, isLogicalOrOperator, isNonNullAssertionPunctuator, isNotNonNullAssertionPunctuator, isNotOptionalChainPunctuator, isOptionalChainPunctuator, isOptionalCallExpression, isSetter, isTSConstructorType, isTSFunctionType, isTypeAssertion, isVariableDeclarator, };
//# sourceMappingURL=predicates.d.ts.map