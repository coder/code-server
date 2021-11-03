import type * as _ts from 'typescript';
/**
 * Common TypeScript interfaces between versions.
 */
export interface TSCommon {
    version: typeof _ts.version;
    sys: typeof _ts.sys;
    ScriptSnapshot: typeof _ts.ScriptSnapshot;
    displayPartsToString: typeof _ts.displayPartsToString;
    createLanguageService: typeof _ts.createLanguageService;
    getDefaultLibFilePath: typeof _ts.getDefaultLibFilePath;
    getPreEmitDiagnostics: typeof _ts.getPreEmitDiagnostics;
    flattenDiagnosticMessageText: typeof _ts.flattenDiagnosticMessageText;
    transpileModule: typeof _ts.transpileModule;
    ModuleKind: typeof _ts.ModuleKind;
    ScriptTarget: typeof _ts.ScriptTarget;
    findConfigFile: typeof _ts.findConfigFile;
    readConfigFile: typeof _ts.readConfigFile;
    parseJsonConfigFileContent: typeof _ts.parseJsonConfigFileContent;
    formatDiagnostics: typeof _ts.formatDiagnostics;
    formatDiagnosticsWithColorAndContext: typeof _ts.formatDiagnosticsWithColorAndContext;
    createDocumentRegistry: typeof _ts.createDocumentRegistry;
    JsxEmit: typeof _ts.JsxEmit;
    createModuleResolutionCache: typeof _ts.createModuleResolutionCache;
    resolveModuleName: typeof _ts.resolveModuleName;
    resolveModuleNameFromCache: typeof _ts.resolveModuleNameFromCache;
    resolveTypeReferenceDirective: typeof _ts.resolveTypeReferenceDirective;
    createIncrementalCompilerHost: typeof _ts.createIncrementalCompilerHost;
    createSourceFile: typeof _ts.createSourceFile;
    getDefaultLibFileName: typeof _ts.getDefaultLibFileName;
    createIncrementalProgram: typeof _ts.createIncrementalProgram;
    createEmitAndSemanticDiagnosticsBuilderProgram: typeof _ts.createEmitAndSemanticDiagnosticsBuilderProgram;
    Extension: typeof _ts.Extension;
    ModuleResolutionKind: typeof _ts.ModuleResolutionKind;
}
