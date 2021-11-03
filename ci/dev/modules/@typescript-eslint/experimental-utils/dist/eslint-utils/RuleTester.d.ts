import * as TSESLint from '../ts-eslint';
declare const parser = "@typescript-eslint/parser";
declare type RuleTesterConfig = Omit<TSESLint.RuleTesterConfig, 'parser'> & {
    parser: typeof parser;
};
declare class RuleTester extends TSESLint.RuleTester {
    #private;
    constructor(options: RuleTesterConfig);
    private getFilename;
    run<TMessageIds extends string, TOptions extends Readonly<unknown[]>>(name: string, rule: TSESLint.RuleModule<TMessageIds, TOptions>, testsReadonly: TSESLint.RunTests<TMessageIds, TOptions>): void;
}
/**
 * Simple no-op tag to mark code samples as "should not format with prettier"
 *   for the internal/plugin-test-formatting lint rule
 */
declare function noFormat(strings: TemplateStringsArray, ...keys: string[]): string;
export { noFormat, RuleTester };
//# sourceMappingURL=RuleTester.d.ts.map