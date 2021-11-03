import { TSESTree } from '../../ts-estree';
declare type IsPunctuatorTokenWithValueFunction<Value extends string> = (token: TSESTree.Token) => token is TSESTree.PunctuatorToken & {
    value: Value;
};
declare type IsNotPunctuatorTokenWithValueFunction<Value extends string> = (token: TSESTree.Token) => token is Exclude<TSESTree.Token, TSESTree.PunctuatorToken & {
    value: Value;
}>;
declare const isArrowToken: IsPunctuatorTokenWithValueFunction<"=>">;
declare const isNotArrowToken: IsNotPunctuatorTokenWithValueFunction<"=>">;
declare const isClosingBraceToken: IsPunctuatorTokenWithValueFunction<"}">;
declare const isNotClosingBraceToken: IsNotPunctuatorTokenWithValueFunction<"}">;
declare const isClosingBracketToken: IsPunctuatorTokenWithValueFunction<"]">;
declare const isNotClosingBracketToken: IsNotPunctuatorTokenWithValueFunction<"]">;
declare const isClosingParenToken: IsPunctuatorTokenWithValueFunction<")">;
declare const isNotClosingParenToken: IsNotPunctuatorTokenWithValueFunction<")">;
declare const isColonToken: IsPunctuatorTokenWithValueFunction<":">;
declare const isNotColonToken: IsNotPunctuatorTokenWithValueFunction<":">;
declare const isCommaToken: IsPunctuatorTokenWithValueFunction<",">;
declare const isNotCommaToken: IsNotPunctuatorTokenWithValueFunction<",">;
declare const isCommentToken: (token: TSESTree.Token) => token is TSESTree.Comment;
declare const isNotCommentToken: (token: TSESTree.Token) => token is TSESTree.BooleanToken | TSESTree.IdentifierToken | TSESTree.JSXIdentifierToken | TSESTree.JSXTextToken | TSESTree.KeywordToken | TSESTree.NullToken | TSESTree.NumericToken | TSESTree.PunctuatorToken | TSESTree.RegularExpressionToken | TSESTree.StringToken | TSESTree.TemplateToken;
declare const isOpeningBraceToken: IsPunctuatorTokenWithValueFunction<"{">;
declare const isNotOpeningBraceToken: IsNotPunctuatorTokenWithValueFunction<"{">;
declare const isOpeningBracketToken: IsPunctuatorTokenWithValueFunction<"[">;
declare const isNotOpeningBracketToken: IsNotPunctuatorTokenWithValueFunction<"[">;
declare const isOpeningParenToken: IsPunctuatorTokenWithValueFunction<"(">;
declare const isNotOpeningParenToken: IsNotPunctuatorTokenWithValueFunction<"(">;
declare const isSemicolonToken: IsPunctuatorTokenWithValueFunction<";">;
declare const isNotSemicolonToken: IsNotPunctuatorTokenWithValueFunction<";">;
export { isArrowToken, isClosingBraceToken, isClosingBracketToken, isClosingParenToken, isColonToken, isCommaToken, isCommentToken, isNotArrowToken, isNotClosingBraceToken, isNotClosingBracketToken, isNotClosingParenToken, isNotColonToken, isNotCommaToken, isNotCommentToken, isNotOpeningBraceToken, isNotOpeningBracketToken, isNotOpeningParenToken, isNotSemicolonToken, isOpeningBraceToken, isOpeningBracketToken, isOpeningParenToken, isSemicolonToken, };
//# sourceMappingURL=predicates.d.ts.map