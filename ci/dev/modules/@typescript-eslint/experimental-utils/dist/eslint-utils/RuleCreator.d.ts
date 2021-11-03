import { RuleMetaData, RuleMetaDataDocs, RuleListener, RuleContext, RuleModule } from '../ts-eslint/Rule';
declare type CreateRuleMetaDocs = Omit<RuleMetaDataDocs, 'url'>;
declare type CreateRuleMeta<TMessageIds extends string> = {
    docs: CreateRuleMetaDocs;
} & Omit<RuleMetaData<TMessageIds>, 'docs'>;
declare function RuleCreator(urlCreator: (ruleName: string) => string): <TOptions extends readonly unknown[], TMessageIds extends string, TRuleListener extends RuleListener = RuleListener>({ name, meta, defaultOptions, create, }: Readonly<{
    name: string;
    meta: CreateRuleMeta<TMessageIds>;
    defaultOptions: Readonly<TOptions>;
    create: (context: Readonly<RuleContext<TMessageIds, TOptions>>, optionsWithDefault: Readonly<TOptions>) => TRuleListener;
}>) => RuleModule<TMessageIds, TOptions, TRuleListener>;
export { RuleCreator };
//# sourceMappingURL=RuleCreator.d.ts.map