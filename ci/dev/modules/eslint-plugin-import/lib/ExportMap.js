'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.


























































































































































































































































































































































































































































































































































































































































































recursivePatternCapture = recursivePatternCapture;var _fs = require('fs');var _fs2 = _interopRequireDefault(_fs);var _doctrine = require('doctrine');var _doctrine2 = _interopRequireDefault(_doctrine);var _debug = require('debug');var _debug2 = _interopRequireDefault(_debug);var _eslint = require('eslint');var _parse = require('eslint-module-utils/parse');var _parse2 = _interopRequireDefault(_parse);var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);var _ignore = require('eslint-module-utils/ignore');var _ignore2 = _interopRequireDefault(_ignore);var _hash = require('eslint-module-utils/hash');var _unambiguous = require('eslint-module-utils/unambiguous');var unambiguous = _interopRequireWildcard(_unambiguous);var _tsconfigLoader = require('tsconfig-paths/lib/tsconfig-loader');var _arrayIncludes = require('array-includes');var _arrayIncludes2 = _interopRequireDefault(_arrayIncludes);function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}let parseConfigFileTextToJson;const log = (0, _debug2.default)('eslint-plugin-import:ExportMap');const exportCache = new Map();const tsConfigCache = new Map();class ExportMap {constructor(path) {this.path = path;this.namespace = new Map(); // todo: restructure to key on path, value is resolver + map of names
    this.reexports = new Map(); /**
                                 * star-exports
                                 * @type {Set} of () => ExportMap
                                 */this.dependencies = new Set(); /**
                                                                   * dependencies of this module that are not explicitly re-exported
                                                                   * @type {Map} from path = () => ExportMap
                                                                   */this.imports = new Map();this.errors = [];}get hasDefault() {return this.get('default') != null;} // stronger than this.has
  get size() {let size = this.namespace.size + this.reexports.size;this.dependencies.forEach(dep => {const d = dep(); // CJS / ignored dependencies won't exist (#717)
      if (d == null) return;size += d.size;});return size;} /**
                                                             * Note that this does not check explicitly re-exported names for existence
                                                             * in the base namespace, but it will expand all `export * from '...'` exports
                                                             * if not found in the explicit namespace.
                                                             * @param  {string}  name
                                                             * @return {Boolean} true if `name` is exported by this module.
                                                             */has(name) {if (this.namespace.has(name)) return true;if (this.reexports.has(name)) return true; // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {for (const dep of this.dependencies) {const innerMap = dep(); // todo: report as unresolved?
        if (!innerMap) continue;if (innerMap.has(name)) return true;}}return false;} /**
                                                                                      * ensure that imported name fully resolves.
                                                                                      * @param  {string} name
                                                                                      * @return {{ found: boolean, path: ExportMap[] }}
                                                                                      */hasDeep(name) {if (this.namespace.has(name)) return { found: true, path: [this] };if (this.reexports.has(name)) {const reexports = this.reexports.get(name);const imported = reexports.getImport(); // if import is ignored, return explicit 'null'
      if (imported == null) return { found: true, path: [this] }; // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) {return { found: false, path: [this] };}const deep = imported.hasDeep(reexports.local);deep.path.unshift(this);return deep;} // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {for (const dep of this.dependencies) {const innerMap = dep();if (innerMap == null) return { found: true, path: [this] }; // todo: report as unresolved?
        if (!innerMap) continue; // safeguard against cycles
        if (innerMap.path === this.path) continue;const innerValue = innerMap.hasDeep(name);if (innerValue.found) {innerValue.path.unshift(this);return innerValue;}}}return { found: false, path: [this] };}get(name) {if (this.namespace.has(name)) return this.namespace.get(name);if (this.reexports.has(name)) {const reexports = this.reexports.get(name);const imported = reexports.getImport(); // if import is ignored, return explicit 'null'
      if (imported == null) return null; // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) return undefined;return imported.get(reexports.local);} // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {for (const dep of this.dependencies) {const innerMap = dep(); // todo: report as unresolved?
        if (!innerMap) continue; // safeguard against cycles
        if (innerMap.path === this.path) continue;const innerValue = innerMap.get(name);if (innerValue !== undefined) return innerValue;}}return undefined;}forEach(callback, thisArg) {this.namespace.forEach((v, n) => callback.call(thisArg, v, n, this));this.reexports.forEach((reexports, name) => {const reexported = reexports.getImport(); // can't look up meta for ignored re-exports (#348)
      callback.call(thisArg, reexported && reexported.get(reexports.local), name, this);});this.dependencies.forEach(dep => {const d = dep(); // CJS / ignored dependencies won't exist (#717)
      if (d == null) return;d.forEach((v, n) => n !== 'default' && callback.call(thisArg, v, n, this));});} // todo: keys, values, entries?
  reportErrors(context, declaration) {context.report({ node: declaration.source, message: `Parse errors in imported module '${declaration.source.value}': ` + `${this.errors.map(e => `${e.message} (${e.lineNumber}:${e.column})`).join(', ')}` });}}exports.default = ExportMap; /**
                                                                                                                                                                                                                                                                                    * parse docs from the first node that has leading comments
                                                                                                                                                                                                                                                                                    */function captureDoc(source, docStyleParsers) {const metadata = {}; // 'some' short-circuits on first 'true'
  for (var _len = arguments.length, nodes = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {nodes[_key - 2] = arguments[_key];}nodes.some(n => {try {let leadingComments; // n.leadingComments is legacy `attachComments` behavior
      if ('leadingComments' in n) {leadingComments = n.leadingComments;} else if (n.range) {leadingComments = source.getCommentsBefore(n);}if (!leadingComments || leadingComments.length === 0) return false;for (const name in docStyleParsers) {const doc = docStyleParsers[name](leadingComments);if (doc) {metadata.doc = doc;}}return true;} catch (err) {return false;}});return metadata;}const availableDocStyleParsers = { jsdoc: captureJsDoc, tomdoc: captureTomDoc }; /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * parse JSDoc from leading comments
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @param {object[]} comments
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @return {{ doc: object }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */function captureJsDoc(comments) {let doc; // capture XSDoc
  comments.forEach(comment => {// skip non-block comments
    if (comment.type !== 'Block') return;try {doc = _doctrine2.default.parse(comment.value, { unwrap: true });} catch (err) {/* don't care, for now? maybe add to `errors?` */}});return doc;} /**
                                                                                                                                                                                                 * parse TomDoc section from comments
                                                                                                                                                                                                 */function captureTomDoc(comments) {// collect lines up to first paragraph break
  const lines = [];for (let i = 0; i < comments.length; i++) {const comment = comments[i];if (comment.value.match(/^\s*$/)) break;lines.push(comment.value.trim());} // return doctrine-like object
  const statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/);if (statusMatch) {return { description: statusMatch[2], tags: [{ title: statusMatch[1].toLowerCase(), description: statusMatch[2] }] };}}const supportedImportTypes = new Set(['ImportDefaultSpecifier', 'ImportNamespaceSpecifier']);ExportMap.get = function (source, context) {const path = (0, _resolve2.default)(source, context);if (path == null) return null;return ExportMap.for(childContext(path, context));};ExportMap.for = function (context) {const path = context.path;const cacheKey = (0, _hash.hashObject)(context).digest('hex');let exportMap = exportCache.get(cacheKey); // return cached ignore
  if (exportMap === null) return null;const stats = _fs2.default.statSync(path);if (exportMap != null) {// date equality check
    if (exportMap.mtime - stats.mtime === 0) {return exportMap;} // future: check content equality?
  } // check valid extensions first
  if (!(0, _ignore.hasValidExtension)(path, context)) {exportCache.set(cacheKey, null);return null;} // check for and cache ignore
  if ((0, _ignore2.default)(path, context)) {log('ignored path due to ignore settings:', path);exportCache.set(cacheKey, null);return null;}const content = _fs2.default.readFileSync(path, { encoding: 'utf8' }); // check for and cache unambiguous modules
  if (!unambiguous.test(content)) {log('ignored path due to unambiguous regex:', path);exportCache.set(cacheKey, null);return null;}log('cache miss', cacheKey, 'for path', path);exportMap = ExportMap.parse(path, content, context); // ambiguous modules return null
  if (exportMap == null) return null;exportMap.mtime = stats.mtime;exportCache.set(cacheKey, exportMap);return exportMap;};ExportMap.parse = function (path, content, context) {const m = new ExportMap(path);let ast;try {ast = (0, _parse2.default)(path, content, context);} catch (err) {log('parse error:', path, err);m.errors.push(err);return m; // can't continue
  }if (!unambiguous.isModule(ast)) return null;const docstyle = context.settings && context.settings['import/docstyle'] || ['jsdoc'];const docStyleParsers = {};docstyle.forEach(style => {docStyleParsers[style] = availableDocStyleParsers[style];}); // attempt to collect module doc
  if (ast.comments) {ast.comments.some(c => {if (c.type !== 'Block') return false;try {const doc = _doctrine2.default.parse(c.value, { unwrap: true });if (doc.tags.some(t => t.title === 'module')) {m.doc = doc;return true;}} catch (err) {/* ignore */}return false;});}const namespaces = new Map();function remotePath(value) {return _resolve2.default.relative(value, path, context.settings);}function resolveImport(value) {const rp = remotePath(value);if (rp == null) return null;return ExportMap.for(childContext(rp, context));}function getNamespace(identifier) {if (!namespaces.has(identifier.name)) return;return function () {return resolveImport(namespaces.get(identifier.name));};}function addNamespace(object, identifier) {const nsfn = getNamespace(identifier);if (nsfn) {Object.defineProperty(object, 'namespace', { get: nsfn });}return object;}function captureDependency(_ref, isOnlyImportingTypes) {let source = _ref.source;let importedSpecifiers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Set();if (source == null) return null;const p = remotePath(source.value);if (p == null) return null;const declarationMetadata = { // capturing actual node reference holds full AST in memory!
      source: { value: source.value, loc: source.loc }, isOnlyImportingTypes, importedSpecifiers };const existing = m.imports.get(p);if (existing != null) {existing.declarations.add(declarationMetadata);return existing.getter;}const getter = thunkFor(p, context);m.imports.set(p, { getter, declarations: new Set([declarationMetadata]) });return getter;}const source = makeSourceCode(content, ast);function readTsConfig() {const tsConfigInfo = (0, _tsconfigLoader.tsConfigLoader)({ cwd: context.parserOptions && context.parserOptions.tsconfigRootDir || process.cwd(), getEnv: key => process.env[key] });try {if (tsConfigInfo.tsConfigPath !== undefined) {const jsonText = _fs2.default.readFileSync(tsConfigInfo.tsConfigPath).toString();if (!parseConfigFileTextToJson) {var _require = require('typescript'); // this is because projects not using TypeScript won't have typescript installed
          parseConfigFileTextToJson = _require.parseConfigFileTextToJson;}return parseConfigFileTextToJson(tsConfigInfo.tsConfigPath, jsonText).config;}} catch (e) {// Catch any errors
    }return null;}function isEsModuleInterop() {const cacheKey = (0, _hash.hashObject)({ tsconfigRootDir: context.parserOptions && context.parserOptions.tsconfigRootDir }).digest('hex');let tsConfig = tsConfigCache.get(cacheKey);if (typeof tsConfig === 'undefined') {tsConfig = readTsConfig();tsConfigCache.set(cacheKey, tsConfig);}return tsConfig && tsConfig.compilerOptions ? tsConfig.compilerOptions.esModuleInterop : false;}ast.body.forEach(function (n) {if (n.type === 'ExportDefaultDeclaration') {const exportMeta = captureDoc(source, docStyleParsers, n);if (n.declaration.type === 'Identifier') {addNamespace(exportMeta, n.declaration);}m.namespace.set('default', exportMeta);return;}if (n.type === 'ExportAllDeclaration') {const getter = captureDependency(n, n.exportKind === 'type');if (getter) m.dependencies.add(getter);return;} // capture namespaces in case of later export
    if (n.type === 'ImportDeclaration') {// import type { Foo } (TS and Flow)
      const declarationIsType = n.importKind === 'type'; // import './foo' or import {} from './foo' (both 0 specifiers) is a side effect and
      // shouldn't be considered to be just importing types
      let specifiersOnlyImportingTypes = n.specifiers.length;const importedSpecifiers = new Set();n.specifiers.forEach(specifier => {if (supportedImportTypes.has(specifier.type)) {importedSpecifiers.add(specifier.type);}if (specifier.type === 'ImportSpecifier') {importedSpecifiers.add(specifier.imported.name);} // import { type Foo } (Flow)
        specifiersOnlyImportingTypes = specifiersOnlyImportingTypes && specifier.importKind === 'type';});captureDependency(n, declarationIsType || specifiersOnlyImportingTypes, importedSpecifiers);const ns = n.specifiers.find(s => s.type === 'ImportNamespaceSpecifier');if (ns) {namespaces.set(ns.local.name, n.source.value);}return;}if (n.type === 'ExportNamedDeclaration') {// capture declaration
      if (n.declaration != null) {switch (n.declaration.type) {case 'FunctionDeclaration':case 'ClassDeclaration':case 'TypeAlias': // flowtype with babel-eslint parser
          case 'InterfaceDeclaration':case 'DeclareFunction':case 'TSDeclareFunction':case 'TSEnumDeclaration':case 'TSTypeAliasDeclaration':case 'TSInterfaceDeclaration':case 'TSAbstractClassDeclaration':case 'TSModuleDeclaration':m.namespace.set(n.declaration.id.name, captureDoc(source, docStyleParsers, n));break;case 'VariableDeclaration':n.declaration.declarations.forEach(d => recursivePatternCapture(d.id, id => m.namespace.set(id.name, captureDoc(source, docStyleParsers, d, n))));break;}}const nsource = n.source && n.source.value;n.specifiers.forEach(s => {const exportMeta = {};let local;switch (s.type) {case 'ExportDefaultSpecifier':if (!n.source) return;local = 'default';break;case 'ExportNamespaceSpecifier':m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', { get() {return resolveImport(nsource);} }));return;case 'ExportSpecifier':if (!n.source) {m.namespace.set(s.exported.name, addNamespace(exportMeta, s.local));return;} // else falls through
          default:local = s.local.name;break;} // todo: JSDoc
        m.reexports.set(s.exported.name, { local, getImport: () => resolveImport(nsource) });});}const isEsModuleInteropTrue = isEsModuleInterop();const exports = ['TSExportAssignment'];if (isEsModuleInteropTrue) {exports.push('TSNamespaceExportDeclaration');} // This doesn't declare anything, but changes what's being exported.
    if ((0, _arrayIncludes2.default)(exports, n.type)) {const exportedName = n.type === 'TSNamespaceExportDeclaration' ? n.id.name : n.expression && n.expression.name || n.expression.id && n.expression.id.name || null;const declTypes = ['VariableDeclaration', 'ClassDeclaration', 'TSDeclareFunction', 'TSEnumDeclaration', 'TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'TSAbstractClassDeclaration', 'TSModuleDeclaration'];const exportedDecls = ast.body.filter((_ref2) => {let type = _ref2.type,id = _ref2.id,declarations = _ref2.declarations;return (0, _arrayIncludes2.default)(declTypes, type) && (id && id.name === exportedName || declarations && declarations.find(d => d.id.name === exportedName));});if (exportedDecls.length === 0) {// Export is not referencing any local declaration, must be re-exporting
        m.namespace.set('default', captureDoc(source, docStyleParsers, n));return;}if (isEsModuleInteropTrue) {m.namespace.set('default', {});}exportedDecls.forEach(decl => {if (decl.type === 'TSModuleDeclaration') {if (decl.body && decl.body.type === 'TSModuleDeclaration') {m.namespace.set(decl.body.id.name, captureDoc(source, docStyleParsers, decl.body));} else if (decl.body && decl.body.body) {decl.body.body.forEach(moduleBlockNode => {// Export-assignment exports all members in the namespace,
              // explicitly exported or not.
              const namespaceDecl = moduleBlockNode.type === 'ExportNamedDeclaration' ? moduleBlockNode.declaration : moduleBlockNode;if (!namespaceDecl) {// TypeScript can check this for us; we needn't
              } else if (namespaceDecl.type === 'VariableDeclaration') {namespaceDecl.declarations.forEach(d => recursivePatternCapture(d.id, id => m.namespace.set(id.name, captureDoc(source, docStyleParsers, decl, namespaceDecl, moduleBlockNode))));} else {m.namespace.set(namespaceDecl.id.name, captureDoc(source, docStyleParsers, moduleBlockNode));}});}} else {// Export as default
          m.namespace.set('default', captureDoc(source, docStyleParsers, decl));}});}});return m;}; /**
                                                                                                     * The creation of this closure is isolated from other scopes
                                                                                                     * to avoid over-retention of unrelated variables, which has
                                                                                                     * caused memory leaks. See #1266.
                                                                                                     */function thunkFor(p, context) {return () => ExportMap.for(childContext(p, context));} /**
                                                                                                                                                                                              * Traverse a pattern/identifier node, calling 'callback'
                                                                                                                                                                                              * for each leaf identifier.
                                                                                                                                                                                              * @param  {node}   pattern
                                                                                                                                                                                              * @param  {Function} callback
                                                                                                                                                                                              * @return {void}
                                                                                                                                                                                              */function recursivePatternCapture(pattern, callback) {switch (pattern.type) {case 'Identifier': // base case
      callback(pattern);break;case 'ObjectPattern':pattern.properties.forEach(p => {if (p.type === 'ExperimentalRestProperty' || p.type === 'RestElement') {callback(p.argument);return;}recursivePatternCapture(p.value, callback);});break;case 'ArrayPattern':pattern.elements.forEach(element => {if (element == null) return;if (element.type === 'ExperimentalRestProperty' || element.type === 'RestElement') {callback(element.argument);return;}recursivePatternCapture(element, callback);});break;case 'AssignmentPattern':callback(pattern.left);break;}} /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       * don't hold full context object in memory, just grab what we need.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       */function childContext(path, context) {const settings = context.settings,parserOptions = context.parserOptions,parserPath = context.parserPath;return { settings, parserOptions, parserPath, path };} /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               * sometimes legacy support isn't _that_ hard... right?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */function makeSourceCode(text, ast) {if (_eslint.SourceCode.length > 1) {// ESLint 3
    return new _eslint.SourceCode(text, ast);} else {// ESLint 4, 5
    return new _eslint.SourceCode({ text, ast });}}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9FeHBvcnRNYXAuanMiXSwibmFtZXMiOlsicmVjdXJzaXZlUGF0dGVybkNhcHR1cmUiLCJ1bmFtYmlndW91cyIsInBhcnNlQ29uZmlnRmlsZVRleHRUb0pzb24iLCJsb2ciLCJleHBvcnRDYWNoZSIsIk1hcCIsInRzQ29uZmlnQ2FjaGUiLCJFeHBvcnRNYXAiLCJjb25zdHJ1Y3RvciIsInBhdGgiLCJuYW1lc3BhY2UiLCJyZWV4cG9ydHMiLCJkZXBlbmRlbmNpZXMiLCJTZXQiLCJpbXBvcnRzIiwiZXJyb3JzIiwiaGFzRGVmYXVsdCIsImdldCIsInNpemUiLCJmb3JFYWNoIiwiZGVwIiwiZCIsImhhcyIsIm5hbWUiLCJpbm5lck1hcCIsImhhc0RlZXAiLCJmb3VuZCIsImltcG9ydGVkIiwiZ2V0SW1wb3J0IiwibG9jYWwiLCJkZWVwIiwidW5zaGlmdCIsImlubmVyVmFsdWUiLCJ1bmRlZmluZWQiLCJjYWxsYmFjayIsInRoaXNBcmciLCJ2IiwibiIsImNhbGwiLCJyZWV4cG9ydGVkIiwicmVwb3J0RXJyb3JzIiwiY29udGV4dCIsImRlY2xhcmF0aW9uIiwicmVwb3J0Iiwibm9kZSIsInNvdXJjZSIsIm1lc3NhZ2UiLCJ2YWx1ZSIsIm1hcCIsImUiLCJsaW5lTnVtYmVyIiwiY29sdW1uIiwiam9pbiIsImNhcHR1cmVEb2MiLCJkb2NTdHlsZVBhcnNlcnMiLCJtZXRhZGF0YSIsIm5vZGVzIiwic29tZSIsImxlYWRpbmdDb21tZW50cyIsInJhbmdlIiwiZ2V0Q29tbWVudHNCZWZvcmUiLCJsZW5ndGgiLCJkb2MiLCJlcnIiLCJhdmFpbGFibGVEb2NTdHlsZVBhcnNlcnMiLCJqc2RvYyIsImNhcHR1cmVKc0RvYyIsInRvbWRvYyIsImNhcHR1cmVUb21Eb2MiLCJjb21tZW50cyIsImNvbW1lbnQiLCJ0eXBlIiwiZG9jdHJpbmUiLCJwYXJzZSIsInVud3JhcCIsImxpbmVzIiwiaSIsIm1hdGNoIiwicHVzaCIsInRyaW0iLCJzdGF0dXNNYXRjaCIsImRlc2NyaXB0aW9uIiwidGFncyIsInRpdGxlIiwidG9Mb3dlckNhc2UiLCJzdXBwb3J0ZWRJbXBvcnRUeXBlcyIsImZvciIsImNoaWxkQ29udGV4dCIsImNhY2hlS2V5IiwiZGlnZXN0IiwiZXhwb3J0TWFwIiwic3RhdHMiLCJmcyIsInN0YXRTeW5jIiwibXRpbWUiLCJzZXQiLCJjb250ZW50IiwicmVhZEZpbGVTeW5jIiwiZW5jb2RpbmciLCJ0ZXN0IiwibSIsImFzdCIsImlzTW9kdWxlIiwiZG9jc3R5bGUiLCJzZXR0aW5ncyIsInN0eWxlIiwiYyIsInQiLCJuYW1lc3BhY2VzIiwicmVtb3RlUGF0aCIsInJlc29sdmUiLCJyZWxhdGl2ZSIsInJlc29sdmVJbXBvcnQiLCJycCIsImdldE5hbWVzcGFjZSIsImlkZW50aWZpZXIiLCJhZGROYW1lc3BhY2UiLCJvYmplY3QiLCJuc2ZuIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJjYXB0dXJlRGVwZW5kZW5jeSIsImlzT25seUltcG9ydGluZ1R5cGVzIiwiaW1wb3J0ZWRTcGVjaWZpZXJzIiwicCIsImRlY2xhcmF0aW9uTWV0YWRhdGEiLCJsb2MiLCJleGlzdGluZyIsImRlY2xhcmF0aW9ucyIsImFkZCIsImdldHRlciIsInRodW5rRm9yIiwibWFrZVNvdXJjZUNvZGUiLCJyZWFkVHNDb25maWciLCJ0c0NvbmZpZ0luZm8iLCJjd2QiLCJwYXJzZXJPcHRpb25zIiwidHNjb25maWdSb290RGlyIiwicHJvY2VzcyIsImdldEVudiIsImtleSIsImVudiIsInRzQ29uZmlnUGF0aCIsImpzb25UZXh0IiwidG9TdHJpbmciLCJyZXF1aXJlIiwiY29uZmlnIiwiaXNFc01vZHVsZUludGVyb3AiLCJ0c0NvbmZpZyIsImNvbXBpbGVyT3B0aW9ucyIsImVzTW9kdWxlSW50ZXJvcCIsImJvZHkiLCJleHBvcnRNZXRhIiwiZXhwb3J0S2luZCIsImRlY2xhcmF0aW9uSXNUeXBlIiwiaW1wb3J0S2luZCIsInNwZWNpZmllcnNPbmx5SW1wb3J0aW5nVHlwZXMiLCJzcGVjaWZpZXJzIiwic3BlY2lmaWVyIiwibnMiLCJmaW5kIiwicyIsImlkIiwibnNvdXJjZSIsImV4cG9ydGVkIiwiaXNFc01vZHVsZUludGVyb3BUcnVlIiwiZXhwb3J0cyIsImV4cG9ydGVkTmFtZSIsImV4cHJlc3Npb24iLCJkZWNsVHlwZXMiLCJleHBvcnRlZERlY2xzIiwiZmlsdGVyIiwiZGVjbCIsIm1vZHVsZUJsb2NrTm9kZSIsIm5hbWVzcGFjZURlY2wiLCJwYXR0ZXJuIiwicHJvcGVydGllcyIsImFyZ3VtZW50IiwiZWxlbWVudHMiLCJlbGVtZW50IiwibGVmdCIsInBhcnNlclBhdGgiLCJ0ZXh0IiwiU291cmNlQ29kZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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LENBSEQsTUFHTyxDQUNMO0FBQ0EsV0FBTyxJQUFJa0Ysa0JBQUosQ0FBZSxFQUFFRCxJQUFGLEVBQVFqRixHQUFSLEVBQWYsQ0FBUCxDQUNELENBQ0YiLCJmaWxlIjoiRXhwb3J0TWFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuaW1wb3J0IGRvY3RyaW5lIGZyb20gJ2RvY3RyaW5lJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcblxuaW1wb3J0IHsgU291cmNlQ29kZSB9IGZyb20gJ2VzbGludCc7XG5cbmltcG9ydCBwYXJzZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3BhcnNlJztcbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSc7XG5pbXBvcnQgaXNJZ25vcmVkLCB7IGhhc1ZhbGlkRXh0ZW5zaW9uIH0gZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9pZ25vcmUnO1xuXG5pbXBvcnQgeyBoYXNoT2JqZWN0IH0gZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9oYXNoJztcbmltcG9ydCAqIGFzIHVuYW1iaWd1b3VzIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvdW5hbWJpZ3VvdXMnO1xuXG5pbXBvcnQgeyB0c0NvbmZpZ0xvYWRlciB9IGZyb20gJ3RzY29uZmlnLXBhdGhzL2xpYi90c2NvbmZpZy1sb2FkZXInO1xuXG5pbXBvcnQgaW5jbHVkZXMgZnJvbSAnYXJyYXktaW5jbHVkZXMnO1xuXG5sZXQgcGFyc2VDb25maWdGaWxlVGV4dFRvSnNvbjtcblxuY29uc3QgbG9nID0gZGVidWcoJ2VzbGludC1wbHVnaW4taW1wb3J0OkV4cG9ydE1hcCcpO1xuXG5jb25zdCBleHBvcnRDYWNoZSA9IG5ldyBNYXAoKTtcbmNvbnN0IHRzQ29uZmlnQ2FjaGUgPSBuZXcgTWFwKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEV4cG9ydE1hcCB7XG4gIGNvbnN0cnVjdG9yKHBhdGgpIHtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMubmFtZXNwYWNlID0gbmV3IE1hcCgpO1xuICAgIC8vIHRvZG86IHJlc3RydWN0dXJlIHRvIGtleSBvbiBwYXRoLCB2YWx1ZSBpcyByZXNvbHZlciArIG1hcCBvZiBuYW1lc1xuICAgIHRoaXMucmVleHBvcnRzID0gbmV3IE1hcCgpO1xuICAgIC8qKlxuICAgICAqIHN0YXItZXhwb3J0c1xuICAgICAqIEB0eXBlIHtTZXR9IG9mICgpID0+IEV4cG9ydE1hcFxuICAgICAqL1xuICAgIHRoaXMuZGVwZW5kZW5jaWVzID0gbmV3IFNldCgpO1xuICAgIC8qKlxuICAgICAqIGRlcGVuZGVuY2llcyBvZiB0aGlzIG1vZHVsZSB0aGF0IGFyZSBub3QgZXhwbGljaXRseSByZS1leHBvcnRlZFxuICAgICAqIEB0eXBlIHtNYXB9IGZyb20gcGF0aCA9ICgpID0+IEV4cG9ydE1hcFxuICAgICAqL1xuICAgIHRoaXMuaW1wb3J0cyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLmVycm9ycyA9IFtdO1xuICB9XG5cbiAgZ2V0IGhhc0RlZmF1bHQoKSB7IHJldHVybiB0aGlzLmdldCgnZGVmYXVsdCcpICE9IG51bGw7IH0gLy8gc3Ryb25nZXIgdGhhbiB0aGlzLmhhc1xuXG4gIGdldCBzaXplKCkge1xuICAgIGxldCBzaXplID0gdGhpcy5uYW1lc3BhY2Uuc2l6ZSArIHRoaXMucmVleHBvcnRzLnNpemU7XG4gICAgdGhpcy5kZXBlbmRlbmNpZXMuZm9yRWFjaChkZXAgPT4ge1xuICAgICAgY29uc3QgZCA9IGRlcCgpO1xuICAgICAgLy8gQ0pTIC8gaWdub3JlZCBkZXBlbmRlbmNpZXMgd29uJ3QgZXhpc3QgKCM3MTcpXG4gICAgICBpZiAoZCA9PSBudWxsKSByZXR1cm47XG4gICAgICBzaXplICs9IGQuc2l6ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2l6ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3RlIHRoYXQgdGhpcyBkb2VzIG5vdCBjaGVjayBleHBsaWNpdGx5IHJlLWV4cG9ydGVkIG5hbWVzIGZvciBleGlzdGVuY2VcbiAgICogaW4gdGhlIGJhc2UgbmFtZXNwYWNlLCBidXQgaXQgd2lsbCBleHBhbmQgYWxsIGBleHBvcnQgKiBmcm9tICcuLi4nYCBleHBvcnRzXG4gICAqIGlmIG5vdCBmb3VuZCBpbiB0aGUgZXhwbGljaXQgbmFtZXNwYWNlLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICBuYW1lXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYG5hbWVgIGlzIGV4cG9ydGVkIGJ5IHRoaXMgbW9kdWxlLlxuICAgKi9cbiAgaGFzKG5hbWUpIHtcbiAgICBpZiAodGhpcy5uYW1lc3BhY2UuaGFzKG5hbWUpKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAodGhpcy5yZWV4cG9ydHMuaGFzKG5hbWUpKSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIGRlZmF1bHQgZXhwb3J0cyBtdXN0IGJlIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgKCMzMjgpXG4gICAgaWYgKG5hbWUgIT09ICdkZWZhdWx0Jykge1xuICAgICAgZm9yIChjb25zdCBkZXAgb2YgdGhpcy5kZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgY29uc3QgaW5uZXJNYXAgPSBkZXAoKTtcblxuICAgICAgICAvLyB0b2RvOiByZXBvcnQgYXMgdW5yZXNvbHZlZD9cbiAgICAgICAgaWYgKCFpbm5lck1hcCkgY29udGludWU7XG5cbiAgICAgICAgaWYgKGlubmVyTWFwLmhhcyhuYW1lKSkgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIGVuc3VyZSB0aGF0IGltcG9ydGVkIG5hbWUgZnVsbHkgcmVzb2x2ZXMuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gbmFtZVxuICAgKiBAcmV0dXJuIHt7IGZvdW5kOiBib29sZWFuLCBwYXRoOiBFeHBvcnRNYXBbXSB9fVxuICAgKi9cbiAgaGFzRGVlcChuYW1lKSB7XG4gICAgaWYgKHRoaXMubmFtZXNwYWNlLmhhcyhuYW1lKSkgcmV0dXJuIHsgZm91bmQ6IHRydWUsIHBhdGg6IFt0aGlzXSB9O1xuXG4gICAgaWYgKHRoaXMucmVleHBvcnRzLmhhcyhuYW1lKSkge1xuICAgICAgY29uc3QgcmVleHBvcnRzID0gdGhpcy5yZWV4cG9ydHMuZ2V0KG5hbWUpO1xuICAgICAgY29uc3QgaW1wb3J0ZWQgPSByZWV4cG9ydHMuZ2V0SW1wb3J0KCk7XG5cbiAgICAgIC8vIGlmIGltcG9ydCBpcyBpZ25vcmVkLCByZXR1cm4gZXhwbGljaXQgJ251bGwnXG4gICAgICBpZiAoaW1wb3J0ZWQgPT0gbnVsbCkgcmV0dXJuIHsgZm91bmQ6IHRydWUsIHBhdGg6IFt0aGlzXSB9O1xuXG4gICAgICAvLyBzYWZlZ3VhcmQgYWdhaW5zdCBjeWNsZXMsIG9ubHkgaWYgbmFtZSBtYXRjaGVzXG4gICAgICBpZiAoaW1wb3J0ZWQucGF0aCA9PT0gdGhpcy5wYXRoICYmIHJlZXhwb3J0cy5sb2NhbCA9PT0gbmFtZSkge1xuICAgICAgICByZXR1cm4geyBmb3VuZDogZmFsc2UsIHBhdGg6IFt0aGlzXSB9O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkZWVwID0gaW1wb3J0ZWQuaGFzRGVlcChyZWV4cG9ydHMubG9jYWwpO1xuICAgICAgZGVlcC5wYXRoLnVuc2hpZnQodGhpcyk7XG5cbiAgICAgIHJldHVybiBkZWVwO1xuICAgIH1cblxuXG4gICAgLy8gZGVmYXVsdCBleHBvcnRzIG11c3QgYmUgZXhwbGljaXRseSByZS1leHBvcnRlZCAoIzMyOClcbiAgICBpZiAobmFtZSAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiB0aGlzLmRlcGVuZGVuY2llcykge1xuICAgICAgICBjb25zdCBpbm5lck1hcCA9IGRlcCgpO1xuICAgICAgICBpZiAoaW5uZXJNYXAgPT0gbnVsbCkgcmV0dXJuIHsgZm91bmQ6IHRydWUsIHBhdGg6IFt0aGlzXSB9O1xuICAgICAgICAvLyB0b2RvOiByZXBvcnQgYXMgdW5yZXNvbHZlZD9cbiAgICAgICAgaWYgKCFpbm5lck1hcCkgY29udGludWU7XG5cbiAgICAgICAgLy8gc2FmZWd1YXJkIGFnYWluc3QgY3ljbGVzXG4gICAgICAgIGlmIChpbm5lck1hcC5wYXRoID09PSB0aGlzLnBhdGgpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IGlubmVyVmFsdWUgPSBpbm5lck1hcC5oYXNEZWVwKG5hbWUpO1xuICAgICAgICBpZiAoaW5uZXJWYWx1ZS5mb3VuZCkge1xuICAgICAgICAgIGlubmVyVmFsdWUucGF0aC51bnNoaWZ0KHRoaXMpO1xuICAgICAgICAgIHJldHVybiBpbm5lclZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgZm91bmQ6IGZhbHNlLCBwYXRoOiBbdGhpc10gfTtcbiAgfVxuXG4gIGdldChuYW1lKSB7XG4gICAgaWYgKHRoaXMubmFtZXNwYWNlLmhhcyhuYW1lKSkgcmV0dXJuIHRoaXMubmFtZXNwYWNlLmdldChuYW1lKTtcblxuICAgIGlmICh0aGlzLnJlZXhwb3J0cy5oYXMobmFtZSkpIHtcbiAgICAgIGNvbnN0IHJlZXhwb3J0cyA9IHRoaXMucmVleHBvcnRzLmdldChuYW1lKTtcbiAgICAgIGNvbnN0IGltcG9ydGVkID0gcmVleHBvcnRzLmdldEltcG9ydCgpO1xuXG4gICAgICAvLyBpZiBpbXBvcnQgaXMgaWdub3JlZCwgcmV0dXJuIGV4cGxpY2l0ICdudWxsJ1xuICAgICAgaWYgKGltcG9ydGVkID09IG51bGwpIHJldHVybiBudWxsO1xuXG4gICAgICAvLyBzYWZlZ3VhcmQgYWdhaW5zdCBjeWNsZXMsIG9ubHkgaWYgbmFtZSBtYXRjaGVzXG4gICAgICBpZiAoaW1wb3J0ZWQucGF0aCA9PT0gdGhpcy5wYXRoICYmIHJlZXhwb3J0cy5sb2NhbCA9PT0gbmFtZSkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIGltcG9ydGVkLmdldChyZWV4cG9ydHMubG9jYWwpO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgZXhwb3J0cyBtdXN0IGJlIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgKCMzMjgpXG4gICAgaWYgKG5hbWUgIT09ICdkZWZhdWx0Jykge1xuICAgICAgZm9yIChjb25zdCBkZXAgb2YgdGhpcy5kZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgY29uc3QgaW5uZXJNYXAgPSBkZXAoKTtcbiAgICAgICAgLy8gdG9kbzogcmVwb3J0IGFzIHVucmVzb2x2ZWQ/XG4gICAgICAgIGlmICghaW5uZXJNYXApIGNvbnRpbnVlO1xuXG4gICAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlc1xuICAgICAgICBpZiAoaW5uZXJNYXAucGF0aCA9PT0gdGhpcy5wYXRoKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCBpbm5lclZhbHVlID0gaW5uZXJNYXAuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoaW5uZXJWYWx1ZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gaW5uZXJWYWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgZm9yRWFjaChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHRoaXMubmFtZXNwYWNlLmZvckVhY2goKHYsIG4pID0+XG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHYsIG4sIHRoaXMpKTtcblxuICAgIHRoaXMucmVleHBvcnRzLmZvckVhY2goKHJlZXhwb3J0cywgbmFtZSkgPT4ge1xuICAgICAgY29uc3QgcmVleHBvcnRlZCA9IHJlZXhwb3J0cy5nZXRJbXBvcnQoKTtcbiAgICAgIC8vIGNhbid0IGxvb2sgdXAgbWV0YSBmb3IgaWdub3JlZCByZS1leHBvcnRzICgjMzQ4KVxuICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCByZWV4cG9ydGVkICYmIHJlZXhwb3J0ZWQuZ2V0KHJlZXhwb3J0cy5sb2NhbCksIG5hbWUsIHRoaXMpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5kZXBlbmRlbmNpZXMuZm9yRWFjaChkZXAgPT4ge1xuICAgICAgY29uc3QgZCA9IGRlcCgpO1xuICAgICAgLy8gQ0pTIC8gaWdub3JlZCBkZXBlbmRlbmNpZXMgd29uJ3QgZXhpc3QgKCM3MTcpXG4gICAgICBpZiAoZCA9PSBudWxsKSByZXR1cm47XG5cbiAgICAgIGQuZm9yRWFjaCgodiwgbikgPT5cbiAgICAgICAgbiAhPT0gJ2RlZmF1bHQnICYmIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdiwgbiwgdGhpcykpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gdG9kbzoga2V5cywgdmFsdWVzLCBlbnRyaWVzP1xuXG4gIHJlcG9ydEVycm9ycyhjb250ZXh0LCBkZWNsYXJhdGlvbikge1xuICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgIG5vZGU6IGRlY2xhcmF0aW9uLnNvdXJjZSxcbiAgICAgIG1lc3NhZ2U6IGBQYXJzZSBlcnJvcnMgaW4gaW1wb3J0ZWQgbW9kdWxlICcke2RlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZX0nOiBgICtcbiAgICAgICAgICAgICAgICAgIGAke3RoaXMuZXJyb3JzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoZSA9PiBgJHtlLm1lc3NhZ2V9ICgke2UubGluZU51bWJlcn06JHtlLmNvbHVtbn0pYClcbiAgICAgICAgICAgICAgICAgICAgLmpvaW4oJywgJyl9YCxcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIHBhcnNlIGRvY3MgZnJvbSB0aGUgZmlyc3Qgbm9kZSB0aGF0IGhhcyBsZWFkaW5nIGNvbW1lbnRzXG4gKi9cbmZ1bmN0aW9uIGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIC4uLm5vZGVzKSB7XG4gIGNvbnN0IG1ldGFkYXRhID0ge307XG5cbiAgLy8gJ3NvbWUnIHNob3J0LWNpcmN1aXRzIG9uIGZpcnN0ICd0cnVlJ1xuICBub2Rlcy5zb21lKG4gPT4ge1xuICAgIHRyeSB7XG5cbiAgICAgIGxldCBsZWFkaW5nQ29tbWVudHM7XG5cbiAgICAgIC8vIG4ubGVhZGluZ0NvbW1lbnRzIGlzIGxlZ2FjeSBgYXR0YWNoQ29tbWVudHNgIGJlaGF2aW9yXG4gICAgICBpZiAoJ2xlYWRpbmdDb21tZW50cycgaW4gbikge1xuICAgICAgICBsZWFkaW5nQ29tbWVudHMgPSBuLmxlYWRpbmdDb21tZW50cztcbiAgICAgIH0gZWxzZSBpZiAobi5yYW5nZSkge1xuICAgICAgICBsZWFkaW5nQ29tbWVudHMgPSBzb3VyY2UuZ2V0Q29tbWVudHNCZWZvcmUobik7XG4gICAgICB9XG5cbiAgICAgIGlmICghbGVhZGluZ0NvbW1lbnRzIHx8IGxlYWRpbmdDb21tZW50cy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcblxuICAgICAgZm9yIChjb25zdCBuYW1lIGluIGRvY1N0eWxlUGFyc2Vycykge1xuICAgICAgICBjb25zdCBkb2MgPSBkb2NTdHlsZVBhcnNlcnNbbmFtZV0obGVhZGluZ0NvbW1lbnRzKTtcbiAgICAgICAgaWYgKGRvYykge1xuICAgICAgICAgIG1ldGFkYXRhLmRvYyA9IGRvYztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBtZXRhZGF0YTtcbn1cblxuY29uc3QgYXZhaWxhYmxlRG9jU3R5bGVQYXJzZXJzID0ge1xuICBqc2RvYzogY2FwdHVyZUpzRG9jLFxuICB0b21kb2M6IGNhcHR1cmVUb21Eb2MsXG59O1xuXG4vKipcbiAqIHBhcnNlIEpTRG9jIGZyb20gbGVhZGluZyBjb21tZW50c1xuICogQHBhcmFtIHtvYmplY3RbXX0gY29tbWVudHNcbiAqIEByZXR1cm4ge3sgZG9jOiBvYmplY3QgfX1cbiAqL1xuZnVuY3Rpb24gY2FwdHVyZUpzRG9jKGNvbW1lbnRzKSB7XG4gIGxldCBkb2M7XG5cbiAgLy8gY2FwdHVyZSBYU0RvY1xuICBjb21tZW50cy5mb3JFYWNoKGNvbW1lbnQgPT4ge1xuICAgIC8vIHNraXAgbm9uLWJsb2NrIGNvbW1lbnRzXG4gICAgaWYgKGNvbW1lbnQudHlwZSAhPT0gJ0Jsb2NrJykgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBkb2MgPSBkb2N0cmluZS5wYXJzZShjb21tZW50LnZhbHVlLCB7IHVud3JhcDogdHJ1ZSB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8qIGRvbid0IGNhcmUsIGZvciBub3c/IG1heWJlIGFkZCB0byBgZXJyb3JzP2AgKi9cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBkb2M7XG59XG5cbi8qKlxuICAqIHBhcnNlIFRvbURvYyBzZWN0aW9uIGZyb20gY29tbWVudHNcbiAgKi9cbmZ1bmN0aW9uIGNhcHR1cmVUb21Eb2MoY29tbWVudHMpIHtcbiAgLy8gY29sbGVjdCBsaW5lcyB1cCB0byBmaXJzdCBwYXJhZ3JhcGggYnJlYWtcbiAgY29uc3QgbGluZXMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21tZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNvbW1lbnQgPSBjb21tZW50c1tpXTtcbiAgICBpZiAoY29tbWVudC52YWx1ZS5tYXRjaCgvXlxccyokLykpIGJyZWFrO1xuICAgIGxpbmVzLnB1c2goY29tbWVudC52YWx1ZS50cmltKCkpO1xuICB9XG5cbiAgLy8gcmV0dXJuIGRvY3RyaW5lLWxpa2Ugb2JqZWN0XG4gIGNvbnN0IHN0YXR1c01hdGNoID0gbGluZXMuam9pbignICcpLm1hdGNoKC9eKFB1YmxpY3xJbnRlcm5hbHxEZXByZWNhdGVkKTpcXHMqKC4rKS8pO1xuICBpZiAoc3RhdHVzTWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGVzY3JpcHRpb246IHN0YXR1c01hdGNoWzJdLFxuICAgICAgdGFnczogW3tcbiAgICAgICAgdGl0bGU6IHN0YXR1c01hdGNoWzFdLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzdGF0dXNNYXRjaFsyXSxcbiAgICAgIH1dLFxuICAgIH07XG4gIH1cbn1cblxuY29uc3Qgc3VwcG9ydGVkSW1wb3J0VHlwZXMgPSBuZXcgU2V0KFsnSW1wb3J0RGVmYXVsdFNwZWNpZmllcicsICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInXSk7XG5cbkV4cG9ydE1hcC5nZXQgPSBmdW5jdGlvbiAoc291cmNlLCBjb250ZXh0KSB7XG4gIGNvbnN0IHBhdGggPSByZXNvbHZlKHNvdXJjZSwgY29udGV4dCk7XG4gIGlmIChwYXRoID09IG51bGwpIHJldHVybiBudWxsO1xuXG4gIHJldHVybiBFeHBvcnRNYXAuZm9yKGNoaWxkQ29udGV4dChwYXRoLCBjb250ZXh0KSk7XG59O1xuXG5FeHBvcnRNYXAuZm9yID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgY29uc3QgeyBwYXRoIH0gPSBjb250ZXh0O1xuXG4gIGNvbnN0IGNhY2hlS2V5ID0gaGFzaE9iamVjdChjb250ZXh0KS5kaWdlc3QoJ2hleCcpO1xuICBsZXQgZXhwb3J0TWFwID0gZXhwb3J0Q2FjaGUuZ2V0KGNhY2hlS2V5KTtcblxuICAvLyByZXR1cm4gY2FjaGVkIGlnbm9yZVxuICBpZiAoZXhwb3J0TWFwID09PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBzdGF0cyA9IGZzLnN0YXRTeW5jKHBhdGgpO1xuICBpZiAoZXhwb3J0TWFwICE9IG51bGwpIHtcbiAgICAvLyBkYXRlIGVxdWFsaXR5IGNoZWNrXG4gICAgaWYgKGV4cG9ydE1hcC5tdGltZSAtIHN0YXRzLm10aW1lID09PSAwKSB7XG4gICAgICByZXR1cm4gZXhwb3J0TWFwO1xuICAgIH1cbiAgICAvLyBmdXR1cmU6IGNoZWNrIGNvbnRlbnQgZXF1YWxpdHk/XG4gIH1cblxuICAvLyBjaGVjayB2YWxpZCBleHRlbnNpb25zIGZpcnN0XG4gIGlmICghaGFzVmFsaWRFeHRlbnNpb24ocGF0aCwgY29udGV4dCkpIHtcbiAgICBleHBvcnRDYWNoZS5zZXQoY2FjaGVLZXksIG51bGwpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gY2hlY2sgZm9yIGFuZCBjYWNoZSBpZ25vcmVcbiAgaWYgKGlzSWdub3JlZChwYXRoLCBjb250ZXh0KSkge1xuICAgIGxvZygnaWdub3JlZCBwYXRoIGR1ZSB0byBpZ25vcmUgc2V0dGluZ3M6JywgcGF0aCk7XG4gICAgZXhwb3J0Q2FjaGUuc2V0KGNhY2hlS2V5LCBudWxsKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMocGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuXG4gIC8vIGNoZWNrIGZvciBhbmQgY2FjaGUgdW5hbWJpZ3VvdXMgbW9kdWxlc1xuICBpZiAoIXVuYW1iaWd1b3VzLnRlc3QoY29udGVudCkpIHtcbiAgICBsb2coJ2lnbm9yZWQgcGF0aCBkdWUgdG8gdW5hbWJpZ3VvdXMgcmVnZXg6JywgcGF0aCk7XG4gICAgZXhwb3J0Q2FjaGUuc2V0KGNhY2hlS2V5LCBudWxsKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGxvZygnY2FjaGUgbWlzcycsIGNhY2hlS2V5LCAnZm9yIHBhdGgnLCBwYXRoKTtcbiAgZXhwb3J0TWFwID0gRXhwb3J0TWFwLnBhcnNlKHBhdGgsIGNvbnRlbnQsIGNvbnRleHQpO1xuXG4gIC8vIGFtYmlndW91cyBtb2R1bGVzIHJldHVybiBudWxsXG4gIGlmIChleHBvcnRNYXAgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgZXhwb3J0TWFwLm10aW1lID0gc3RhdHMubXRpbWU7XG5cbiAgZXhwb3J0Q2FjaGUuc2V0KGNhY2hlS2V5LCBleHBvcnRNYXApO1xuICByZXR1cm4gZXhwb3J0TWFwO1xufTtcblxuXG5FeHBvcnRNYXAucGFyc2UgPSBmdW5jdGlvbiAocGF0aCwgY29udGVudCwgY29udGV4dCkge1xuICBjb25zdCBtID0gbmV3IEV4cG9ydE1hcChwYXRoKTtcblxuICBsZXQgYXN0O1xuICB0cnkge1xuICAgIGFzdCA9IHBhcnNlKHBhdGgsIGNvbnRlbnQsIGNvbnRleHQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2coJ3BhcnNlIGVycm9yOicsIHBhdGgsIGVycik7XG4gICAgbS5lcnJvcnMucHVzaChlcnIpO1xuICAgIHJldHVybiBtOyAvLyBjYW4ndCBjb250aW51ZVxuICB9XG5cbiAgaWYgKCF1bmFtYmlndW91cy5pc01vZHVsZShhc3QpKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBkb2NzdHlsZSA9IChjb250ZXh0LnNldHRpbmdzICYmIGNvbnRleHQuc2V0dGluZ3NbJ2ltcG9ydC9kb2NzdHlsZSddKSB8fCBbJ2pzZG9jJ107XG4gIGNvbnN0IGRvY1N0eWxlUGFyc2VycyA9IHt9O1xuICBkb2NzdHlsZS5mb3JFYWNoKHN0eWxlID0+IHtcbiAgICBkb2NTdHlsZVBhcnNlcnNbc3R5bGVdID0gYXZhaWxhYmxlRG9jU3R5bGVQYXJzZXJzW3N0eWxlXTtcbiAgfSk7XG5cbiAgLy8gYXR0ZW1wdCB0byBjb2xsZWN0IG1vZHVsZSBkb2NcbiAgaWYgKGFzdC5jb21tZW50cykge1xuICAgIGFzdC5jb21tZW50cy5zb21lKGMgPT4ge1xuICAgICAgaWYgKGMudHlwZSAhPT0gJ0Jsb2NrJykgcmV0dXJuIGZhbHNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZG9jID0gZG9jdHJpbmUucGFyc2UoYy52YWx1ZSwgeyB1bndyYXA6IHRydWUgfSk7XG4gICAgICAgIGlmIChkb2MudGFncy5zb21lKHQgPT4gdC50aXRsZSA9PT0gJ21vZHVsZScpKSB7XG4gICAgICAgICAgbS5kb2MgPSBkb2M7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikgeyAvKiBpZ25vcmUgKi8gfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgbmFtZXNwYWNlcyA9IG5ldyBNYXAoKTtcblxuICBmdW5jdGlvbiByZW1vdGVQYXRoKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlc29sdmUucmVsYXRpdmUodmFsdWUsIHBhdGgsIGNvbnRleHQuc2V0dGluZ3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZUltcG9ydCh2YWx1ZSkge1xuICAgIGNvbnN0IHJwID0gcmVtb3RlUGF0aCh2YWx1ZSk7XG4gICAgaWYgKHJwID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBFeHBvcnRNYXAuZm9yKGNoaWxkQ29udGV4dChycCwgY29udGV4dCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKGlkZW50aWZpZXIpIHtcbiAgICBpZiAoIW5hbWVzcGFjZXMuaGFzKGlkZW50aWZpZXIubmFtZSkpIHJldHVybjtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZUltcG9ydChuYW1lc3BhY2VzLmdldChpZGVudGlmaWVyLm5hbWUpKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkTmFtZXNwYWNlKG9iamVjdCwgaWRlbnRpZmllcikge1xuICAgIGNvbnN0IG5zZm4gPSBnZXROYW1lc3BhY2UoaWRlbnRpZmllcik7XG4gICAgaWYgKG5zZm4pIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICduYW1lc3BhY2UnLCB7IGdldDogbnNmbiB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FwdHVyZURlcGVuZGVuY3koeyBzb3VyY2UgfSwgaXNPbmx5SW1wb3J0aW5nVHlwZXMsIGltcG9ydGVkU3BlY2lmaWVycyA9IG5ldyBTZXQoKSkge1xuICAgIGlmIChzb3VyY2UgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBwID0gcmVtb3RlUGF0aChzb3VyY2UudmFsdWUpO1xuICAgIGlmIChwID09IG51bGwpIHJldHVybiBudWxsO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25NZXRhZGF0YSA9IHtcbiAgICAgIC8vIGNhcHR1cmluZyBhY3R1YWwgbm9kZSByZWZlcmVuY2UgaG9sZHMgZnVsbCBBU1QgaW4gbWVtb3J5IVxuICAgICAgc291cmNlOiB7IHZhbHVlOiBzb3VyY2UudmFsdWUsIGxvYzogc291cmNlLmxvYyB9LFxuICAgICAgaXNPbmx5SW1wb3J0aW5nVHlwZXMsXG4gICAgICBpbXBvcnRlZFNwZWNpZmllcnMsXG4gICAgfTtcblxuICAgIGNvbnN0IGV4aXN0aW5nID0gbS5pbXBvcnRzLmdldChwKTtcbiAgICBpZiAoZXhpc3RpbmcgIT0gbnVsbCkge1xuICAgICAgZXhpc3RpbmcuZGVjbGFyYXRpb25zLmFkZChkZWNsYXJhdGlvbk1ldGFkYXRhKTtcbiAgICAgIHJldHVybiBleGlzdGluZy5nZXR0ZXI7XG4gICAgfVxuXG4gICAgY29uc3QgZ2V0dGVyID0gdGh1bmtGb3IocCwgY29udGV4dCk7XG4gICAgbS5pbXBvcnRzLnNldChwLCB7IGdldHRlciwgZGVjbGFyYXRpb25zOiBuZXcgU2V0KFtkZWNsYXJhdGlvbk1ldGFkYXRhXSkgfSk7XG4gICAgcmV0dXJuIGdldHRlcjtcbiAgfVxuXG4gIGNvbnN0IHNvdXJjZSA9IG1ha2VTb3VyY2VDb2RlKGNvbnRlbnQsIGFzdCk7XG5cbiAgZnVuY3Rpb24gcmVhZFRzQ29uZmlnKCkge1xuICAgIGNvbnN0IHRzQ29uZmlnSW5mbyA9IHRzQ29uZmlnTG9hZGVyKHtcbiAgICAgIGN3ZDpcbiAgICAgICAgKGNvbnRleHQucGFyc2VyT3B0aW9ucyAmJiBjb250ZXh0LnBhcnNlck9wdGlvbnMudHNjb25maWdSb290RGlyKSB8fFxuICAgICAgICBwcm9jZXNzLmN3ZCgpLFxuICAgICAgZ2V0RW52OiAoa2V5KSA9PiBwcm9jZXNzLmVudltrZXldLFxuICAgIH0pO1xuICAgIHRyeSB7XG4gICAgICBpZiAodHNDb25maWdJbmZvLnRzQ29uZmlnUGF0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IGpzb25UZXh0ID0gZnMucmVhZEZpbGVTeW5jKHRzQ29uZmlnSW5mby50c0NvbmZpZ1BhdGgpLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmICghcGFyc2VDb25maWdGaWxlVGV4dFRvSnNvbikge1xuICAgICAgICAgIC8vIHRoaXMgaXMgYmVjYXVzZSBwcm9qZWN0cyBub3QgdXNpbmcgVHlwZVNjcmlwdCB3b24ndCBoYXZlIHR5cGVzY3JpcHQgaW5zdGFsbGVkXG4gICAgICAgICAgKHsgcGFyc2VDb25maWdGaWxlVGV4dFRvSnNvbiB9ID0gcmVxdWlyZSgndHlwZXNjcmlwdCcpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFyc2VDb25maWdGaWxlVGV4dFRvSnNvbih0c0NvbmZpZ0luZm8udHNDb25maWdQYXRoLCBqc29uVGV4dCkuY29uZmlnO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIENhdGNoIGFueSBlcnJvcnNcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzRXNNb2R1bGVJbnRlcm9wKCkge1xuICAgIGNvbnN0IGNhY2hlS2V5ID0gaGFzaE9iamVjdCh7XG4gICAgICB0c2NvbmZpZ1Jvb3REaXI6IGNvbnRleHQucGFyc2VyT3B0aW9ucyAmJiBjb250ZXh0LnBhcnNlck9wdGlvbnMudHNjb25maWdSb290RGlyLFxuICAgIH0pLmRpZ2VzdCgnaGV4Jyk7XG4gICAgbGV0IHRzQ29uZmlnID0gdHNDb25maWdDYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgIGlmICh0eXBlb2YgdHNDb25maWcgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0c0NvbmZpZyA9IHJlYWRUc0NvbmZpZygpO1xuICAgICAgdHNDb25maWdDYWNoZS5zZXQoY2FjaGVLZXksIHRzQ29uZmlnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHNDb25maWcgJiYgdHNDb25maWcuY29tcGlsZXJPcHRpb25zID8gdHNDb25maWcuY29tcGlsZXJPcHRpb25zLmVzTW9kdWxlSW50ZXJvcCA6IGZhbHNlO1xuICB9XG5cbiAgYXN0LmJvZHkuZm9yRWFjaChmdW5jdGlvbiAobikge1xuICAgIGlmIChuLnR5cGUgPT09ICdFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24nKSB7XG4gICAgICBjb25zdCBleHBvcnRNZXRhID0gY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2Vycywgbik7XG4gICAgICBpZiAobi5kZWNsYXJhdGlvbi50eXBlID09PSAnSWRlbnRpZmllcicpIHtcbiAgICAgICAgYWRkTmFtZXNwYWNlKGV4cG9ydE1ldGEsIG4uZGVjbGFyYXRpb24pO1xuICAgICAgfVxuICAgICAgbS5uYW1lc3BhY2Uuc2V0KCdkZWZhdWx0JywgZXhwb3J0TWV0YSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG4udHlwZSA9PT0gJ0V4cG9ydEFsbERlY2xhcmF0aW9uJykge1xuICAgICAgY29uc3QgZ2V0dGVyID0gY2FwdHVyZURlcGVuZGVuY3kobiwgbi5leHBvcnRLaW5kID09PSAndHlwZScpO1xuICAgICAgaWYgKGdldHRlcikgbS5kZXBlbmRlbmNpZXMuYWRkKGdldHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gY2FwdHVyZSBuYW1lc3BhY2VzIGluIGNhc2Ugb2YgbGF0ZXIgZXhwb3J0XG4gICAgaWYgKG4udHlwZSA9PT0gJ0ltcG9ydERlY2xhcmF0aW9uJykge1xuICAgICAgLy8gaW1wb3J0IHR5cGUgeyBGb28gfSAoVFMgYW5kIEZsb3cpXG4gICAgICBjb25zdCBkZWNsYXJhdGlvbklzVHlwZSA9IG4uaW1wb3J0S2luZCA9PT0gJ3R5cGUnO1xuICAgICAgLy8gaW1wb3J0ICcuL2Zvbycgb3IgaW1wb3J0IHt9IGZyb20gJy4vZm9vJyAoYm90aCAwIHNwZWNpZmllcnMpIGlzIGEgc2lkZSBlZmZlY3QgYW5kXG4gICAgICAvLyBzaG91bGRuJ3QgYmUgY29uc2lkZXJlZCB0byBiZSBqdXN0IGltcG9ydGluZyB0eXBlc1xuICAgICAgbGV0IHNwZWNpZmllcnNPbmx5SW1wb3J0aW5nVHlwZXMgPSBuLnNwZWNpZmllcnMubGVuZ3RoO1xuICAgICAgY29uc3QgaW1wb3J0ZWRTcGVjaWZpZXJzID0gbmV3IFNldCgpO1xuICAgICAgbi5zcGVjaWZpZXJzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICAgICAgaWYgKHN1cHBvcnRlZEltcG9ydFR5cGVzLmhhcyhzcGVjaWZpZXIudHlwZSkpIHtcbiAgICAgICAgICBpbXBvcnRlZFNwZWNpZmllcnMuYWRkKHNwZWNpZmllci50eXBlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BlY2lmaWVyLnR5cGUgPT09ICdJbXBvcnRTcGVjaWZpZXInKSB7XG4gICAgICAgICAgaW1wb3J0ZWRTcGVjaWZpZXJzLmFkZChzcGVjaWZpZXIuaW1wb3J0ZWQubmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbXBvcnQgeyB0eXBlIEZvbyB9IChGbG93KVxuICAgICAgICBzcGVjaWZpZXJzT25seUltcG9ydGluZ1R5cGVzID1cbiAgICAgICAgICBzcGVjaWZpZXJzT25seUltcG9ydGluZ1R5cGVzICYmIHNwZWNpZmllci5pbXBvcnRLaW5kID09PSAndHlwZSc7XG4gICAgICB9KTtcbiAgICAgIGNhcHR1cmVEZXBlbmRlbmN5KG4sIGRlY2xhcmF0aW9uSXNUeXBlIHx8IHNwZWNpZmllcnNPbmx5SW1wb3J0aW5nVHlwZXMsIGltcG9ydGVkU3BlY2lmaWVycyk7XG5cbiAgICAgIGNvbnN0IG5zID0gbi5zcGVjaWZpZXJzLmZpbmQocyA9PiBzLnR5cGUgPT09ICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInKTtcbiAgICAgIGlmIChucykge1xuICAgICAgICBuYW1lc3BhY2VzLnNldChucy5sb2NhbC5uYW1lLCBuLnNvdXJjZS52YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG4udHlwZSA9PT0gJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nKSB7XG4gICAgICAvLyBjYXB0dXJlIGRlY2xhcmF0aW9uXG4gICAgICBpZiAobi5kZWNsYXJhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHN3aXRjaCAobi5kZWNsYXJhdGlvbi50eXBlKSB7XG4gICAgICAgIGNhc2UgJ0Z1bmN0aW9uRGVjbGFyYXRpb24nOlxuICAgICAgICBjYXNlICdDbGFzc0RlY2xhcmF0aW9uJzpcbiAgICAgICAgY2FzZSAnVHlwZUFsaWFzJzogLy8gZmxvd3R5cGUgd2l0aCBiYWJlbC1lc2xpbnQgcGFyc2VyXG4gICAgICAgIGNhc2UgJ0ludGVyZmFjZURlY2xhcmF0aW9uJzpcbiAgICAgICAgY2FzZSAnRGVjbGFyZUZ1bmN0aW9uJzpcbiAgICAgICAgY2FzZSAnVFNEZWNsYXJlRnVuY3Rpb24nOlxuICAgICAgICBjYXNlICdUU0VudW1EZWNsYXJhdGlvbic6XG4gICAgICAgIGNhc2UgJ1RTVHlwZUFsaWFzRGVjbGFyYXRpb24nOlxuICAgICAgICBjYXNlICdUU0ludGVyZmFjZURlY2xhcmF0aW9uJzpcbiAgICAgICAgY2FzZSAnVFNBYnN0cmFjdENsYXNzRGVjbGFyYXRpb24nOlxuICAgICAgICBjYXNlICdUU01vZHVsZURlY2xhcmF0aW9uJzpcbiAgICAgICAgICBtLm5hbWVzcGFjZS5zZXQobi5kZWNsYXJhdGlvbi5pZC5uYW1lLCBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBuKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1ZhcmlhYmxlRGVjbGFyYXRpb24nOlxuICAgICAgICAgIG4uZGVjbGFyYXRpb24uZGVjbGFyYXRpb25zLmZvckVhY2goKGQpID0+XG4gICAgICAgICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShkLmlkLFxuICAgICAgICAgICAgICBpZCA9PiBtLm5hbWVzcGFjZS5zZXQoaWQubmFtZSwgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgZCwgbikpKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgbnNvdXJjZSA9IG4uc291cmNlICYmIG4uc291cmNlLnZhbHVlO1xuICAgICAgbi5zcGVjaWZpZXJzLmZvckVhY2goKHMpID0+IHtcbiAgICAgICAgY29uc3QgZXhwb3J0TWV0YSA9IHt9O1xuICAgICAgICBsZXQgbG9jYWw7XG5cbiAgICAgICAgc3dpdGNoIChzLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnRXhwb3J0RGVmYXVsdFNwZWNpZmllcic6XG4gICAgICAgICAgaWYgKCFuLnNvdXJjZSkgcmV0dXJuO1xuICAgICAgICAgIGxvY2FsID0gJ2RlZmF1bHQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdFeHBvcnROYW1lc3BhY2VTcGVjaWZpZXInOlxuICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChzLmV4cG9ydGVkLm5hbWUsIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRNZXRhLCAnbmFtZXNwYWNlJywge1xuICAgICAgICAgICAgZ2V0KCkgeyByZXR1cm4gcmVzb2x2ZUltcG9ydChuc291cmNlKTsgfSxcbiAgICAgICAgICB9KSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjYXNlICdFeHBvcnRTcGVjaWZpZXInOlxuICAgICAgICAgIGlmICghbi5zb3VyY2UpIHtcbiAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChzLmV4cG9ydGVkLm5hbWUsIGFkZE5hbWVzcGFjZShleHBvcnRNZXRhLCBzLmxvY2FsKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGVsc2UgZmFsbHMgdGhyb3VnaFxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGxvY2FsID0gcy5sb2NhbC5uYW1lO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdG9kbzogSlNEb2NcbiAgICAgICAgbS5yZWV4cG9ydHMuc2V0KHMuZXhwb3J0ZWQubmFtZSwgeyBsb2NhbCwgZ2V0SW1wb3J0OiAoKSA9PiByZXNvbHZlSW1wb3J0KG5zb3VyY2UpIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgaXNFc01vZHVsZUludGVyb3BUcnVlID0gaXNFc01vZHVsZUludGVyb3AoKTtcblxuICAgIGNvbnN0IGV4cG9ydHMgPSBbJ1RTRXhwb3J0QXNzaWdubWVudCddO1xuICAgIGlmIChpc0VzTW9kdWxlSW50ZXJvcFRydWUpIHtcbiAgICAgIGV4cG9ydHMucHVzaCgnVFNOYW1lc3BhY2VFeHBvcnREZWNsYXJhdGlvbicpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgZG9lc24ndCBkZWNsYXJlIGFueXRoaW5nLCBidXQgY2hhbmdlcyB3aGF0J3MgYmVpbmcgZXhwb3J0ZWQuXG4gICAgaWYgKGluY2x1ZGVzKGV4cG9ydHMsIG4udHlwZSkpIHtcbiAgICAgIGNvbnN0IGV4cG9ydGVkTmFtZSA9IG4udHlwZSA9PT0gJ1RTTmFtZXNwYWNlRXhwb3J0RGVjbGFyYXRpb24nXG4gICAgICAgID8gbi5pZC5uYW1lXG4gICAgICAgIDogKG4uZXhwcmVzc2lvbiAmJiBuLmV4cHJlc3Npb24ubmFtZSB8fCAobi5leHByZXNzaW9uLmlkICYmIG4uZXhwcmVzc2lvbi5pZC5uYW1lKSB8fCBudWxsKTtcbiAgICAgIGNvbnN0IGRlY2xUeXBlcyA9IFtcbiAgICAgICAgJ1ZhcmlhYmxlRGVjbGFyYXRpb24nLFxuICAgICAgICAnQ2xhc3NEZWNsYXJhdGlvbicsXG4gICAgICAgICdUU0RlY2xhcmVGdW5jdGlvbicsXG4gICAgICAgICdUU0VudW1EZWNsYXJhdGlvbicsXG4gICAgICAgICdUU1R5cGVBbGlhc0RlY2xhcmF0aW9uJyxcbiAgICAgICAgJ1RTSW50ZXJmYWNlRGVjbGFyYXRpb24nLFxuICAgICAgICAnVFNBYnN0cmFjdENsYXNzRGVjbGFyYXRpb24nLFxuICAgICAgICAnVFNNb2R1bGVEZWNsYXJhdGlvbicsXG4gICAgICBdO1xuICAgICAgY29uc3QgZXhwb3J0ZWREZWNscyA9IGFzdC5ib2R5LmZpbHRlcigoeyB0eXBlLCBpZCwgZGVjbGFyYXRpb25zIH0pID0+IGluY2x1ZGVzKGRlY2xUeXBlcywgdHlwZSkgJiYgKFxuICAgICAgICAoaWQgJiYgaWQubmFtZSA9PT0gZXhwb3J0ZWROYW1lKSB8fCAoZGVjbGFyYXRpb25zICYmIGRlY2xhcmF0aW9ucy5maW5kKChkKSA9PiBkLmlkLm5hbWUgPT09IGV4cG9ydGVkTmFtZSkpXG4gICAgICApKTtcbiAgICAgIGlmIChleHBvcnRlZERlY2xzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBFeHBvcnQgaXMgbm90IHJlZmVyZW5jaW5nIGFueSBsb2NhbCBkZWNsYXJhdGlvbiwgbXVzdCBiZSByZS1leHBvcnRpbmdcbiAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KCdkZWZhdWx0JywgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgbikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoaXNFc01vZHVsZUludGVyb3BUcnVlKSB7XG4gICAgICAgIG0ubmFtZXNwYWNlLnNldCgnZGVmYXVsdCcsIHt9KTtcbiAgICAgIH1cbiAgICAgIGV4cG9ydGVkRGVjbHMuZm9yRWFjaCgoZGVjbCkgPT4ge1xuICAgICAgICBpZiAoZGVjbC50eXBlID09PSAnVFNNb2R1bGVEZWNsYXJhdGlvbicpIHtcbiAgICAgICAgICBpZiAoZGVjbC5ib2R5ICYmIGRlY2wuYm9keS50eXBlID09PSAnVFNNb2R1bGVEZWNsYXJhdGlvbicpIHtcbiAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChkZWNsLmJvZHkuaWQubmFtZSwgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgZGVjbC5ib2R5KSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChkZWNsLmJvZHkgJiYgZGVjbC5ib2R5LmJvZHkpIHtcbiAgICAgICAgICAgIGRlY2wuYm9keS5ib2R5LmZvckVhY2goKG1vZHVsZUJsb2NrTm9kZSkgPT4ge1xuICAgICAgICAgICAgICAvLyBFeHBvcnQtYXNzaWdubWVudCBleHBvcnRzIGFsbCBtZW1iZXJzIGluIHRoZSBuYW1lc3BhY2UsXG4gICAgICAgICAgICAgIC8vIGV4cGxpY2l0bHkgZXhwb3J0ZWQgb3Igbm90LlxuICAgICAgICAgICAgICBjb25zdCBuYW1lc3BhY2VEZWNsID0gbW9kdWxlQmxvY2tOb2RlLnR5cGUgPT09ICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJyA/XG4gICAgICAgICAgICAgICAgbW9kdWxlQmxvY2tOb2RlLmRlY2xhcmF0aW9uIDpcbiAgICAgICAgICAgICAgICBtb2R1bGVCbG9ja05vZGU7XG5cbiAgICAgICAgICAgICAgaWYgKCFuYW1lc3BhY2VEZWNsKSB7XG4gICAgICAgICAgICAgICAgLy8gVHlwZVNjcmlwdCBjYW4gY2hlY2sgdGhpcyBmb3IgdXM7IHdlIG5lZWRuJ3RcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lc3BhY2VEZWNsLnR5cGUgPT09ICdWYXJpYWJsZURlY2xhcmF0aW9uJykge1xuICAgICAgICAgICAgICAgIG5hbWVzcGFjZURlY2wuZGVjbGFyYXRpb25zLmZvckVhY2goKGQpID0+XG4gICAgICAgICAgICAgICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShkLmlkLCAoaWQpID0+IG0ubmFtZXNwYWNlLnNldChcbiAgICAgICAgICAgICAgICAgICAgaWQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgZGVjbCwgbmFtZXNwYWNlRGVjbCwgbW9kdWxlQmxvY2tOb2RlKVxuICAgICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZURlY2wuaWQubmFtZSxcbiAgICAgICAgICAgICAgICAgIGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIG1vZHVsZUJsb2NrTm9kZSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gRXhwb3J0IGFzIGRlZmF1bHRcbiAgICAgICAgICBtLm5hbWVzcGFjZS5zZXQoJ2RlZmF1bHQnLCBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBkZWNsKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG07XG59O1xuXG4vKipcbiAqIFRoZSBjcmVhdGlvbiBvZiB0aGlzIGNsb3N1cmUgaXMgaXNvbGF0ZWQgZnJvbSBvdGhlciBzY29wZXNcbiAqIHRvIGF2b2lkIG92ZXItcmV0ZW50aW9uIG9mIHVucmVsYXRlZCB2YXJpYWJsZXMsIHdoaWNoIGhhc1xuICogY2F1c2VkIG1lbW9yeSBsZWFrcy4gU2VlICMxMjY2LlxuICovXG5mdW5jdGlvbiB0aHVua0ZvcihwLCBjb250ZXh0KSB7XG4gIHJldHVybiAoKSA9PiBFeHBvcnRNYXAuZm9yKGNoaWxkQ29udGV4dChwLCBjb250ZXh0KSk7XG59XG5cblxuLyoqXG4gKiBUcmF2ZXJzZSBhIHBhdHRlcm4vaWRlbnRpZmllciBub2RlLCBjYWxsaW5nICdjYWxsYmFjaydcbiAqIGZvciBlYWNoIGxlYWYgaWRlbnRpZmllci5cbiAqIEBwYXJhbSAge25vZGV9ICAgcGF0dGVyblxuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUocGF0dGVybiwgY2FsbGJhY2spIHtcbiAgc3dpdGNoIChwYXR0ZXJuLnR5cGUpIHtcbiAgY2FzZSAnSWRlbnRpZmllcic6IC8vIGJhc2UgY2FzZVxuICAgIGNhbGxiYWNrKHBhdHRlcm4pO1xuICAgIGJyZWFrO1xuXG4gIGNhc2UgJ09iamVjdFBhdHRlcm4nOlxuICAgIHBhdHRlcm4ucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAudHlwZSA9PT0gJ0V4cGVyaW1lbnRhbFJlc3RQcm9wZXJ0eScgfHwgcC50eXBlID09PSAnUmVzdEVsZW1lbnQnKSB7XG4gICAgICAgIGNhbGxiYWNrKHAuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShwLnZhbHVlLCBjYWxsYmFjayk7XG4gICAgfSk7XG4gICAgYnJlYWs7XG5cbiAgY2FzZSAnQXJyYXlQYXR0ZXJuJzpcbiAgICBwYXR0ZXJuLmVsZW1lbnRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgIGlmIChlbGVtZW50ID09IG51bGwpIHJldHVybjtcbiAgICAgIGlmIChlbGVtZW50LnR5cGUgPT09ICdFeHBlcmltZW50YWxSZXN0UHJvcGVydHknIHx8IGVsZW1lbnQudHlwZSA9PT0gJ1Jlc3RFbGVtZW50Jykge1xuICAgICAgICBjYWxsYmFjayhlbGVtZW50LmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUoZWxlbWVudCwgY2FsbGJhY2spO1xuICAgIH0pO1xuICAgIGJyZWFrO1xuXG4gIGNhc2UgJ0Fzc2lnbm1lbnRQYXR0ZXJuJzpcbiAgICBjYWxsYmFjayhwYXR0ZXJuLmxlZnQpO1xuICAgIGJyZWFrO1xuICB9XG59XG5cbi8qKlxuICogZG9uJ3QgaG9sZCBmdWxsIGNvbnRleHQgb2JqZWN0IGluIG1lbW9yeSwganVzdCBncmFiIHdoYXQgd2UgbmVlZC5cbiAqL1xuZnVuY3Rpb24gY2hpbGRDb250ZXh0KHBhdGgsIGNvbnRleHQpIHtcbiAgY29uc3QgeyBzZXR0aW5ncywgcGFyc2VyT3B0aW9ucywgcGFyc2VyUGF0aCB9ID0gY29udGV4dDtcbiAgcmV0dXJuIHtcbiAgICBzZXR0aW5ncyxcbiAgICBwYXJzZXJPcHRpb25zLFxuICAgIHBhcnNlclBhdGgsXG4gICAgcGF0aCxcbiAgfTtcbn1cblxuXG4vKipcbiAqIHNvbWV0aW1lcyBsZWdhY3kgc3VwcG9ydCBpc24ndCBfdGhhdF8gaGFyZC4uLiByaWdodD9cbiAqL1xuZnVuY3Rpb24gbWFrZVNvdXJjZUNvZGUodGV4dCwgYXN0KSB7XG4gIGlmIChTb3VyY2VDb2RlLmxlbmd0aCA+IDEpIHtcbiAgICAvLyBFU0xpbnQgM1xuICAgIHJldHVybiBuZXcgU291cmNlQ29kZSh0ZXh0LCBhc3QpO1xuICB9IGVsc2Uge1xuICAgIC8vIEVTTGludCA0LCA1XG4gICAgcmV0dXJuIG5ldyBTb3VyY2VDb2RlKHsgdGV4dCwgYXN0IH0pO1xuICB9XG59XG4iXX0=