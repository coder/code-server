'use strict';





var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _ignore = require('eslint-module-utils/ignore');
var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);
var _path = require('path');
var _readPkgUp = require('read-pkg-up');var _readPkgUp2 = _interopRequireDefault(_readPkgUp);
var _object = require('object.values');var _object2 = _interopRequireDefault(_object);
var _arrayIncludes = require('array-includes');var _arrayIncludes2 = _interopRequireDefault(_arrayIncludes);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;} else {return Array.from(arr);}} /**
                                                                                                                                                                                                                                                                                                                                                                                                   * @fileOverview Ensures that modules contain exports and/or all
                                                                                                                                                                                                                                                                                                                                                                                                   * modules are consumed within other modules.
                                                                                                                                                                                                                                                                                                                                                                                                   * @author René Fermann
                                                                                                                                                                                                                                                                                                                                                                                                   */ // eslint/lib/util/glob-util has been moved to eslint/lib/util/glob-utils with version 5.3
// and has been moved to eslint/lib/cli-engine/file-enumerator in version 6
let listFilesToProcess;try {const FileEnumerator = require('eslint/lib/cli-engine/file-enumerator').FileEnumerator;
  listFilesToProcess = function (src, extensions) {
    const e = new FileEnumerator({
      extensions: extensions });

    return Array.from(e.iterateFiles(src), (_ref) => {let filePath = _ref.filePath,ignored = _ref.ignored;return {
        ignored,
        filename: filePath };});

  };
} catch (e1) {
  // Prevent passing invalid options (extensions array) to old versions of the function.
  // https://github.com/eslint/eslint/blob/v5.16.0/lib/util/glob-utils.js#L178-L280
  // https://github.com/eslint/eslint/blob/v5.2.0/lib/util/glob-util.js#L174-L269
  let originalListFilesToProcess;
  try {
    originalListFilesToProcess = require('eslint/lib/util/glob-utils').listFilesToProcess;
    listFilesToProcess = function (src, extensions) {
      return originalListFilesToProcess(src, {
        extensions: extensions });

    };
  } catch (e2) {
    originalListFilesToProcess = require('eslint/lib/util/glob-util').listFilesToProcess;

    listFilesToProcess = function (src, extensions) {
      const patterns = src.reduce((carry, pattern) => {
        return carry.concat(extensions.map(extension => {
          return (/\*\*|\*\./.test(pattern) ? pattern : `${pattern}/**/*${extension}`);
        }));
      }, src.slice());

      return originalListFilesToProcess(patterns);
    };
  }
}

const EXPORT_DEFAULT_DECLARATION = 'ExportDefaultDeclaration';
const EXPORT_NAMED_DECLARATION = 'ExportNamedDeclaration';
const EXPORT_ALL_DECLARATION = 'ExportAllDeclaration';
const IMPORT_DECLARATION = 'ImportDeclaration';
const IMPORT_NAMESPACE_SPECIFIER = 'ImportNamespaceSpecifier';
const IMPORT_DEFAULT_SPECIFIER = 'ImportDefaultSpecifier';
const VARIABLE_DECLARATION = 'VariableDeclaration';
const FUNCTION_DECLARATION = 'FunctionDeclaration';
const CLASS_DECLARATION = 'ClassDeclaration';
const IDENTIFIER = 'Identifier';
const OBJECT_PATTERN = 'ObjectPattern';
const TS_INTERFACE_DECLARATION = 'TSInterfaceDeclaration';
const TS_TYPE_ALIAS_DECLARATION = 'TSTypeAliasDeclaration';
const TS_ENUM_DECLARATION = 'TSEnumDeclaration';
const DEFAULT = 'default';

function forEachDeclarationIdentifier(declaration, cb) {
  if (declaration) {
    if (
    declaration.type === FUNCTION_DECLARATION ||
    declaration.type === CLASS_DECLARATION ||
    declaration.type === TS_INTERFACE_DECLARATION ||
    declaration.type === TS_TYPE_ALIAS_DECLARATION ||
    declaration.type === TS_ENUM_DECLARATION)
    {
      cb(declaration.id.name);
    } else if (declaration.type === VARIABLE_DECLARATION) {
      declaration.declarations.forEach((_ref2) => {let id = _ref2.id;
        if (id.type === OBJECT_PATTERN) {
          (0, _ExportMap.recursivePatternCapture)(id, pattern => {
            if (pattern.type === IDENTIFIER) {
              cb(pattern.name);
            }
          });
        } else {
          cb(id.name);
        }
      });
    }
  }
}

/**
   * List of imports per file.
   *
   * Represented by a two-level Map to a Set of identifiers. The upper-level Map
   * keys are the paths to the modules containing the imports, while the
   * lower-level Map keys are the paths to the files which are being imported
   * from. Lastly, the Set of identifiers contains either names being imported
   * or a special AST node name listed above (e.g ImportDefaultSpecifier).
   *
   * For example, if we have a file named foo.js containing:
   *
   *   import { o2 } from './bar.js';
   *
   * Then we will have a structure that looks like:
   *
   *   Map { 'foo.js' => Map { 'bar.js' => Set { 'o2' } } }
   *
   * @type {Map<string, Map<string, Set<string>>>}
   */
const importList = new Map();

/**
                               * List of exports per file.
                               *
                               * Represented by a two-level Map to an object of metadata. The upper-level Map
                               * keys are the paths to the modules containing the exports, while the
                               * lower-level Map keys are the specific identifiers or special AST node names
                               * being exported. The leaf-level metadata object at the moment only contains a
                               * `whereUsed` property, which contains a Set of paths to modules that import
                               * the name.
                               *
                               * For example, if we have a file named bar.js containing the following exports:
                               *
                               *   const o2 = 'bar';
                               *   export { o2 };
                               *
                               * And a file named foo.js containing the following import:
                               *
                               *   import { o2 } from './bar.js';
                               *
                               * Then we will have a structure that looks like:
                               *
                               *   Map { 'bar.js' => Map { 'o2' => { whereUsed: Set { 'foo.js' } } } }
                               *
                               * @type {Map<string, Map<string, object>>}
                               */
const exportList = new Map();

const ignoredFiles = new Set();
const filesOutsideSrc = new Set();

const isNodeModule = path => {
  return (/\/(node_modules)\//.test(path));
};

/**
    * read all files matching the patterns in src and ignoreExports
    *
    * return all files matching src pattern, which are not matching the ignoreExports pattern
    */
const resolveFiles = (src, ignoreExports, context) => {
  const extensions = Array.from((0, _ignore.getFileExtensions)(context.settings));

  const srcFiles = new Set();
  const srcFileList = listFilesToProcess(src, extensions);

  // prepare list of ignored files
  const ignoredFilesList = listFilesToProcess(ignoreExports, extensions);
  ignoredFilesList.forEach((_ref3) => {let filename = _ref3.filename;return ignoredFiles.add(filename);});

  // prepare list of source files, don't consider files from node_modules
  srcFileList.filter((_ref4) => {let filename = _ref4.filename;return !isNodeModule(filename);}).forEach((_ref5) => {let filename = _ref5.filename;
    srcFiles.add(filename);
  });
  return srcFiles;
};

/**
    * parse all source files and build up 2 maps containing the existing imports and exports
    */
const prepareImportsAndExports = (srcFiles, context) => {
  const exportAll = new Map();
  srcFiles.forEach(file => {
    const exports = new Map();
    const imports = new Map();
    const currentExports = _ExportMap2.default.get(file, context);
    if (currentExports) {const
      dependencies = currentExports.dependencies,reexports = currentExports.reexports,localImportList = currentExports.imports,namespace = currentExports.namespace;

      // dependencies === export * from
      const currentExportAll = new Set();
      dependencies.forEach(getDependency => {
        const dependency = getDependency();
        if (dependency === null) {
          return;
        }

        currentExportAll.add(dependency.path);
      });
      exportAll.set(file, currentExportAll);

      reexports.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
        const reexport = value.getImport();
        if (!reexport) {
          return;
        }
        let localImport = imports.get(reexport.path);
        let currentValue;
        if (value.local === DEFAULT) {
          currentValue = IMPORT_DEFAULT_SPECIFIER;
        } else {
          currentValue = value.local;
        }
        if (typeof localImport !== 'undefined') {
          localImport = new Set([].concat(_toConsumableArray(localImport), [currentValue]));
        } else {
          localImport = new Set([currentValue]);
        }
        imports.set(reexport.path, localImport);
      });

      localImportList.forEach((value, key) => {
        if (isNodeModule(key)) {
          return;
        }
        const localImport = imports.get(key) || new Set();
        value.declarations.forEach((_ref6) => {let importedSpecifiers = _ref6.importedSpecifiers;return (
            importedSpecifiers.forEach(specifier => localImport.add(specifier)));});

        imports.set(key, localImport);
      });
      importList.set(file, imports);

      // build up export list only, if file is not ignored
      if (ignoredFiles.has(file)) {
        return;
      }
      namespace.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
      });
    }
    exports.set(EXPORT_ALL_DECLARATION, { whereUsed: new Set() });
    exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed: new Set() });
    exportList.set(file, exports);
  });
  exportAll.forEach((value, key) => {
    value.forEach(val => {
      const currentExports = exportList.get(val);
      const currentExport = currentExports.get(EXPORT_ALL_DECLARATION);
      currentExport.whereUsed.add(key);
    });
  });
};

/**
    * traverse through all imports and add the respective path to the whereUsed-list
    * of the corresponding export
    */
const determineUsage = () => {
  importList.forEach((listValue, listKey) => {
    listValue.forEach((value, key) => {
      const exports = exportList.get(key);
      if (typeof exports !== 'undefined') {
        value.forEach(currentImport => {
          let specifier;
          if (currentImport === IMPORT_NAMESPACE_SPECIFIER) {
            specifier = IMPORT_NAMESPACE_SPECIFIER;
          } else if (currentImport === IMPORT_DEFAULT_SPECIFIER) {
            specifier = IMPORT_DEFAULT_SPECIFIER;
          } else {
            specifier = currentImport;
          }
          if (typeof specifier !== 'undefined') {
            const exportStatement = exports.get(specifier);
            if (typeof exportStatement !== 'undefined') {const
              whereUsed = exportStatement.whereUsed;
              whereUsed.add(listKey);
              exports.set(specifier, { whereUsed });
            }
          }
        });
      }
    });
  });
};

const getSrc = src => {
  if (src) {
    return src;
  }
  return [process.cwd()];
};

/**
    * prepare the lists of existing imports and exports - should only be executed once at
    * the start of a new eslint run
    */
let srcFiles;
let lastPrepareKey;
const doPreparation = (src, ignoreExports, context) => {
  const prepareKey = JSON.stringify({
    src: (src || []).sort(),
    ignoreExports: (ignoreExports || []).sort(),
    extensions: Array.from((0, _ignore.getFileExtensions)(context.settings)).sort() });

  if (prepareKey === lastPrepareKey) {
    return;
  }

  importList.clear();
  exportList.clear();
  ignoredFiles.clear();
  filesOutsideSrc.clear();

  srcFiles = resolveFiles(getSrc(src), ignoreExports, context);
  prepareImportsAndExports(srcFiles, context);
  determineUsage();
  lastPrepareKey = prepareKey;
};

const newNamespaceImportExists = specifiers =>
specifiers.some((_ref7) => {let type = _ref7.type;return type === IMPORT_NAMESPACE_SPECIFIER;});

const newDefaultImportExists = specifiers =>
specifiers.some((_ref8) => {let type = _ref8.type;return type === IMPORT_DEFAULT_SPECIFIER;});

const fileIsInPkg = file => {var _readPkgUp$sync =
  _readPkgUp2.default.sync({ cwd: file, normalize: false });const path = _readPkgUp$sync.path,pkg = _readPkgUp$sync.pkg;
  const basePath = (0, _path.dirname)(path);

  const checkPkgFieldString = pkgField => {
    if ((0, _path.join)(basePath, pkgField) === file) {
      return true;
    }
  };

  const checkPkgFieldObject = pkgField => {
    const pkgFieldFiles = (0, _object2.default)(pkgField).map(value => (0, _path.join)(basePath, value));
    if ((0, _arrayIncludes2.default)(pkgFieldFiles, file)) {
      return true;
    }
  };

  const checkPkgField = pkgField => {
    if (typeof pkgField === 'string') {
      return checkPkgFieldString(pkgField);
    }

    if (typeof pkgField === 'object') {
      return checkPkgFieldObject(pkgField);
    }
  };

  if (pkg.private === true) {
    return false;
  }

  if (pkg.bin) {
    if (checkPkgField(pkg.bin)) {
      return true;
    }
  }

  if (pkg.browser) {
    if (checkPkgField(pkg.browser)) {
      return true;
    }
  }

  if (pkg.main) {
    if (checkPkgFieldString(pkg.main)) {
      return true;
    }
  }

  return false;
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: { url: (0, _docsUrl2.default)('no-unused-modules') },
    schema: [{
      properties: {
        src: {
          description: 'files/paths to be analyzed (only for unused exports)',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string',
            minLength: 1 } },


        ignoreExports: {
          description:
          'files/paths for which unused exports will not be reported (e.g module entry points)',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string',
            minLength: 1 } },


        missingExports: {
          description: 'report modules without any exports',
          type: 'boolean' },

        unusedExports: {
          description: 'report exports without any usage',
          type: 'boolean' } },


      not: {
        properties: {
          unusedExports: { enum: [false] },
          missingExports: { enum: [false] } } },


      anyOf: [{
        not: {
          properties: {
            unusedExports: { enum: [true] } } },


        required: ['missingExports'] },
      {
        not: {
          properties: {
            missingExports: { enum: [true] } } },


        required: ['unusedExports'] },
      {
        properties: {
          unusedExports: { enum: [true] } },

        required: ['unusedExports'] },
      {
        properties: {
          missingExports: { enum: [true] } },

        required: ['missingExports'] }] }] },




  create: context => {var _ref9 =





    context.options[0] || {};const src = _ref9.src;var _ref9$ignoreExports = _ref9.ignoreExports;const ignoreExports = _ref9$ignoreExports === undefined ? [] : _ref9$ignoreExports,missingExports = _ref9.missingExports,unusedExports = _ref9.unusedExports;

    if (unusedExports) {
      doPreparation(src, ignoreExports, context);
    }

    const file = context.getFilename();

    const checkExportPresence = node => {
      if (!missingExports) {
        return;
      }

      if (ignoredFiles.has(file)) {
        return;
      }

      const exportCount = exportList.get(file);
      const exportAll = exportCount.get(EXPORT_ALL_DECLARATION);
      const namespaceImports = exportCount.get(IMPORT_NAMESPACE_SPECIFIER);

      exportCount.delete(EXPORT_ALL_DECLARATION);
      exportCount.delete(IMPORT_NAMESPACE_SPECIFIER);
      if (exportCount.size < 1) {
        // node.body[0] === 'undefined' only happens, if everything is commented out in the file
        // being linted
        context.report(node.body[0] ? node.body[0] : node, 'No exports found');
      }
      exportCount.set(EXPORT_ALL_DECLARATION, exportAll);
      exportCount.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
    };

    const checkUsage = (node, exportedValue) => {
      if (!unusedExports) {
        return;
      }

      if (ignoredFiles.has(file)) {
        return;
      }

      if (fileIsInPkg(file)) {
        return;
      }

      if (filesOutsideSrc.has(file)) {
        return;
      }

      // make sure file to be linted is included in source files
      if (!srcFiles.has(file)) {
        srcFiles = resolveFiles(getSrc(src), ignoreExports, context);
        if (!srcFiles.has(file)) {
          filesOutsideSrc.add(file);
          return;
        }
      }

      exports = exportList.get(file);

      // special case: export * from
      const exportAll = exports.get(EXPORT_ALL_DECLARATION);
      if (typeof exportAll !== 'undefined' && exportedValue !== IMPORT_DEFAULT_SPECIFIER) {
        if (exportAll.whereUsed.size > 0) {
          return;
        }
      }

      // special case: namespace import
      const namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);
      if (typeof namespaceImports !== 'undefined') {
        if (namespaceImports.whereUsed.size > 0) {
          return;
        }
      }

      // exportsList will always map any imported value of 'default' to 'ImportDefaultSpecifier'
      const exportsKey = exportedValue === DEFAULT ? IMPORT_DEFAULT_SPECIFIER : exportedValue;

      const exportStatement = exports.get(exportsKey);

      const value = exportsKey === IMPORT_DEFAULT_SPECIFIER ? DEFAULT : exportsKey;

      if (typeof exportStatement !== 'undefined') {
        if (exportStatement.whereUsed.size < 1) {
          context.report(
          node,
          `exported declaration '${value}' not used within other modules`);

        }
      } else {
        context.report(
        node,
        `exported declaration '${value}' not used within other modules`);

      }
    };

    /**
        * only useful for tools like vscode-eslint
        *
        * update lists of existing exports during runtime
        */
    const updateExportUsage = node => {
      if (ignoredFiles.has(file)) {
        return;
      }

      let exports = exportList.get(file);

      // new module has been created during runtime
      // include it in further processing
      if (typeof exports === 'undefined') {
        exports = new Map();
      }

      const newExports = new Map();
      const newExportIdentifiers = new Set();

      node.body.forEach((_ref10) => {let type = _ref10.type,declaration = _ref10.declaration,specifiers = _ref10.specifiers;
        if (type === EXPORT_DEFAULT_DECLARATION) {
          newExportIdentifiers.add(IMPORT_DEFAULT_SPECIFIER);
        }
        if (type === EXPORT_NAMED_DECLARATION) {
          if (specifiers.length > 0) {
            specifiers.forEach(specifier => {
              if (specifier.exported) {
                newExportIdentifiers.add(specifier.exported.name);
              }
            });
          }
          forEachDeclarationIdentifier(declaration, name => {
            newExportIdentifiers.add(name);
          });
        }
      });

      // old exports exist within list of new exports identifiers: add to map of new exports
      exports.forEach((value, key) => {
        if (newExportIdentifiers.has(key)) {
          newExports.set(key, value);
        }
      });

      // new export identifiers added: add to map of new exports
      newExportIdentifiers.forEach(key => {
        if (!exports.has(key)) {
          newExports.set(key, { whereUsed: new Set() });
        }
      });

      // preserve information about namespace imports
      const exportAll = exports.get(EXPORT_ALL_DECLARATION);
      let namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);

      if (typeof namespaceImports === 'undefined') {
        namespaceImports = { whereUsed: new Set() };
      }

      newExports.set(EXPORT_ALL_DECLARATION, exportAll);
      newExports.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
      exportList.set(file, newExports);
    };

    /**
        * only useful for tools like vscode-eslint
        *
        * update lists of existing imports during runtime
        */
    const updateImportUsage = node => {
      if (!unusedExports) {
        return;
      }

      let oldImportPaths = importList.get(file);
      if (typeof oldImportPaths === 'undefined') {
        oldImportPaths = new Map();
      }

      const oldNamespaceImports = new Set();
      const newNamespaceImports = new Set();

      const oldExportAll = new Set();
      const newExportAll = new Set();

      const oldDefaultImports = new Set();
      const newDefaultImports = new Set();

      const oldImports = new Map();
      const newImports = new Map();
      oldImportPaths.forEach((value, key) => {
        if (value.has(EXPORT_ALL_DECLARATION)) {
          oldExportAll.add(key);
        }
        if (value.has(IMPORT_NAMESPACE_SPECIFIER)) {
          oldNamespaceImports.add(key);
        }
        if (value.has(IMPORT_DEFAULT_SPECIFIER)) {
          oldDefaultImports.add(key);
        }
        value.forEach(val => {
          if (val !== IMPORT_NAMESPACE_SPECIFIER &&
          val !== IMPORT_DEFAULT_SPECIFIER) {
            oldImports.set(val, key);
          }
        });
      });

      node.body.forEach(astNode => {
        let resolvedPath;

        // support for export { value } from 'module'
        if (astNode.type === EXPORT_NAMED_DECLARATION) {
          if (astNode.source) {
            resolvedPath = (0, _resolve2.default)(astNode.source.raw.replace(/('|")/g, ''), context);
            astNode.specifiers.forEach(specifier => {
              const name = specifier.local.name;
              if (specifier.local.name === DEFAULT) {
                newDefaultImports.add(resolvedPath);
              } else {
                newImports.set(name, resolvedPath);
              }
            });
          }
        }

        if (astNode.type === EXPORT_ALL_DECLARATION) {
          resolvedPath = (0, _resolve2.default)(astNode.source.raw.replace(/('|")/g, ''), context);
          newExportAll.add(resolvedPath);
        }

        if (astNode.type === IMPORT_DECLARATION) {
          resolvedPath = (0, _resolve2.default)(astNode.source.raw.replace(/('|")/g, ''), context);
          if (!resolvedPath) {
            return;
          }

          if (isNodeModule(resolvedPath)) {
            return;
          }

          if (newNamespaceImportExists(astNode.specifiers)) {
            newNamespaceImports.add(resolvedPath);
          }

          if (newDefaultImportExists(astNode.specifiers)) {
            newDefaultImports.add(resolvedPath);
          }

          astNode.specifiers.forEach(specifier => {
            if (specifier.type === IMPORT_DEFAULT_SPECIFIER ||
            specifier.type === IMPORT_NAMESPACE_SPECIFIER) {
              return;
            }
            newImports.set(specifier.imported.name, resolvedPath);
          });
        }
      });

      newExportAll.forEach(value => {
        if (!oldExportAll.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(EXPORT_ALL_DECLARATION);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(EXPORT_ALL_DECLARATION);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(EXPORT_ALL_DECLARATION, { whereUsed });
          }
        }
      });

      oldExportAll.forEach(value => {
        if (!newExportAll.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(EXPORT_ALL_DECLARATION);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(EXPORT_ALL_DECLARATION);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newDefaultImports.forEach(value => {
        if (!oldDefaultImports.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(IMPORT_DEFAULT_SPECIFIER);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed });
          }
        }
      });

      oldDefaultImports.forEach(value => {
        if (!newDefaultImports.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(IMPORT_DEFAULT_SPECIFIER);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newNamespaceImports.forEach(value => {
        if (!oldNamespaceImports.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(IMPORT_NAMESPACE_SPECIFIER);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed });
          }
        }
      });

      oldNamespaceImports.forEach(value => {
        if (!newNamespaceImports.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(IMPORT_NAMESPACE_SPECIFIER);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newImports.forEach((value, key) => {
        if (!oldImports.has(key)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(key);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(key);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(key, { whereUsed });
          }
        }
      });

      oldImports.forEach((value, key) => {
        if (!newImports.has(key)) {
          const imports = oldImportPaths.get(value);
          imports.delete(key);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(key);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });
    };

    return {
      'Program:exit': node => {
        updateExportUsage(node);
        updateImportUsage(node);
        checkExportPresence(node);
      },
      'ExportDefaultDeclaration': node => {
        checkUsage(node, IMPORT_DEFAULT_SPECIFIER);
      },
      'ExportNamedDeclaration': node => {
        node.specifiers.forEach(specifier => {
          checkUsage(node, specifier.exported.name);
        });
        forEachDeclarationIdentifier(node.declaration, name => {
          checkUsage(node, name);
        });
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby11bnVzZWQtbW9kdWxlcy5qcyJdLCJuYW1lcyI6WyJsaXN0RmlsZXNUb1Byb2Nlc3MiLCJGaWxlRW51bWVyYXRvciIsInJlcXVpcmUiLCJzcmMiLCJleHRlbnNpb25zIiwiZSIsIkFycmF5IiwiZnJvbSIsIml0ZXJhdGVGaWxlcyIsImZpbGVQYXRoIiwiaWdub3JlZCIsImZpbGVuYW1lIiwiZTEiLCJvcmlnaW5hbExpc3RGaWxlc1RvUHJvY2VzcyIsImUyIiwicGF0dGVybnMiLCJyZWR1Y2UiLCJjYXJyeSIsInBhdHRlcm4iLCJjb25jYXQiLCJtYXAiLCJleHRlbnNpb24iLCJ0ZXN0Iiwic2xpY2UiLCJFWFBPUlRfREVGQVVMVF9ERUNMQVJBVElPTiIsIkVYUE9SVF9OQU1FRF9ERUNMQVJBVElPTiIsIkVYUE9SVF9BTExfREVDTEFSQVRJT04iLCJJTVBPUlRfREVDTEFSQVRJT04iLCJJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiIsIklNUE9SVF9ERUZBVUxUX1NQRUNJRklFUiIsIlZBUklBQkxFX0RFQ0xBUkFUSU9OIiwiRlVOQ1RJT05fREVDTEFSQVRJT04iLCJDTEFTU19ERUNMQVJBVElPTiIsIklERU5USUZJRVIiLCJPQkpFQ1RfUEFUVEVSTiIsIlRTX0lOVEVSRkFDRV9ERUNMQVJBVElPTiIsIlRTX1RZUEVfQUxJQVNfREVDTEFSQVRJT04iLCJUU19FTlVNX0RFQ0xBUkFUSU9OIiwiREVGQVVMVCIsImZvckVhY2hEZWNsYXJhdGlvbklkZW50aWZpZXIiLCJkZWNsYXJhdGlvbiIsImNiIiwidHlwZSIsImlkIiwibmFtZSIsImRlY2xhcmF0aW9ucyIsImZvckVhY2giLCJpbXBvcnRMaXN0IiwiTWFwIiwiZXhwb3J0TGlzdCIsImlnbm9yZWRGaWxlcyIsIlNldCIsImZpbGVzT3V0c2lkZVNyYyIsImlzTm9kZU1vZHVsZSIsInBhdGgiLCJyZXNvbHZlRmlsZXMiLCJpZ25vcmVFeHBvcnRzIiwiY29udGV4dCIsInNldHRpbmdzIiwic3JjRmlsZXMiLCJzcmNGaWxlTGlzdCIsImlnbm9yZWRGaWxlc0xpc3QiLCJhZGQiLCJmaWx0ZXIiLCJwcmVwYXJlSW1wb3J0c0FuZEV4cG9ydHMiLCJleHBvcnRBbGwiLCJmaWxlIiwiZXhwb3J0cyIsImltcG9ydHMiLCJjdXJyZW50RXhwb3J0cyIsIkV4cG9ydHMiLCJnZXQiLCJkZXBlbmRlbmNpZXMiLCJyZWV4cG9ydHMiLCJsb2NhbEltcG9ydExpc3QiLCJuYW1lc3BhY2UiLCJjdXJyZW50RXhwb3J0QWxsIiwiZ2V0RGVwZW5kZW5jeSIsImRlcGVuZGVuY3kiLCJzZXQiLCJ2YWx1ZSIsImtleSIsIndoZXJlVXNlZCIsInJlZXhwb3J0IiwiZ2V0SW1wb3J0IiwibG9jYWxJbXBvcnQiLCJjdXJyZW50VmFsdWUiLCJsb2NhbCIsImltcG9ydGVkU3BlY2lmaWVycyIsInNwZWNpZmllciIsImhhcyIsInZhbCIsImN1cnJlbnRFeHBvcnQiLCJkZXRlcm1pbmVVc2FnZSIsImxpc3RWYWx1ZSIsImxpc3RLZXkiLCJjdXJyZW50SW1wb3J0IiwiZXhwb3J0U3RhdGVtZW50IiwiZ2V0U3JjIiwicHJvY2VzcyIsImN3ZCIsImxhc3RQcmVwYXJlS2V5IiwiZG9QcmVwYXJhdGlvbiIsInByZXBhcmVLZXkiLCJKU09OIiwic3RyaW5naWZ5Iiwic29ydCIsImNsZWFyIiwibmV3TmFtZXNwYWNlSW1wb3J0RXhpc3RzIiwic3BlY2lmaWVycyIsInNvbWUiLCJuZXdEZWZhdWx0SW1wb3J0RXhpc3RzIiwiZmlsZUlzSW5Qa2ciLCJyZWFkUGtnVXAiLCJzeW5jIiwibm9ybWFsaXplIiwicGtnIiwiYmFzZVBhdGgiLCJjaGVja1BrZ0ZpZWxkU3RyaW5nIiwicGtnRmllbGQiLCJjaGVja1BrZ0ZpZWxkT2JqZWN0IiwicGtnRmllbGRGaWxlcyIsImNoZWNrUGtnRmllbGQiLCJwcml2YXRlIiwiYmluIiwiYnJvd3NlciIsIm1haW4iLCJtb2R1bGUiLCJtZXRhIiwiZG9jcyIsInVybCIsInNjaGVtYSIsInByb3BlcnRpZXMiLCJkZXNjcmlwdGlvbiIsIm1pbkl0ZW1zIiwiaXRlbXMiLCJtaW5MZW5ndGgiLCJtaXNzaW5nRXhwb3J0cyIsInVudXNlZEV4cG9ydHMiLCJub3QiLCJlbnVtIiwiYW55T2YiLCJyZXF1aXJlZCIsImNyZWF0ZSIsIm9wdGlvbnMiLCJnZXRGaWxlbmFtZSIsImNoZWNrRXhwb3J0UHJlc2VuY2UiLCJub2RlIiwiZXhwb3J0Q291bnQiLCJuYW1lc3BhY2VJbXBvcnRzIiwiZGVsZXRlIiwic2l6ZSIsInJlcG9ydCIsImJvZHkiLCJjaGVja1VzYWdlIiwiZXhwb3J0ZWRWYWx1ZSIsImV4cG9ydHNLZXkiLCJ1cGRhdGVFeHBvcnRVc2FnZSIsIm5ld0V4cG9ydHMiLCJuZXdFeHBvcnRJZGVudGlmaWVycyIsImxlbmd0aCIsImV4cG9ydGVkIiwidXBkYXRlSW1wb3J0VXNhZ2UiLCJvbGRJbXBvcnRQYXRocyIsIm9sZE5hbWVzcGFjZUltcG9ydHMiLCJuZXdOYW1lc3BhY2VJbXBvcnRzIiwib2xkRXhwb3J0QWxsIiwibmV3RXhwb3J0QWxsIiwib2xkRGVmYXVsdEltcG9ydHMiLCJuZXdEZWZhdWx0SW1wb3J0cyIsIm9sZEltcG9ydHMiLCJuZXdJbXBvcnRzIiwiYXN0Tm9kZSIsInJlc29sdmVkUGF0aCIsInNvdXJjZSIsInJhdyIsInJlcGxhY2UiLCJpbXBvcnRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBTUEseUM7QUFDQTtBQUNBLHNEO0FBQ0EscUM7QUFDQTtBQUNBLHdDO0FBQ0EsdUM7QUFDQSwrQyxtVkFiQTs7OztzWUFlQTtBQUNBO0FBQ0EsSUFBSUEsa0JBQUosQ0FDQSxJQUFJLENBQ0YsTUFBTUMsaUJBQWlCQyxRQUFRLHVDQUFSLEVBQWlERCxjQUF4RTtBQUNBRCx1QkFBcUIsVUFBVUcsR0FBVixFQUFlQyxVQUFmLEVBQTJCO0FBQzlDLFVBQU1DLElBQUksSUFBSUosY0FBSixDQUFtQjtBQUMzQkcsa0JBQVlBLFVBRGUsRUFBbkIsQ0FBVjs7QUFHQSxXQUFPRSxNQUFNQyxJQUFOLENBQVdGLEVB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QyxrQkFBTXlCLGdCQUFnQnpCLFFBQVFJLEdBQVIsQ0FBWVUsR0FBWixDQUF0QjtBQUNBLGdCQUFJLE9BQU9XLGFBQVAsS0FBeUIsV0FBN0IsRUFBMEM7QUFDeENBLDRCQUFjVixTQUFkLENBQXdCb0UsTUFBeEIsQ0FBK0JwRixJQUEvQjtBQUNEO0FBQ0Y7QUFDRjtBQUNGLE9BYkQ7QUFjRCxLQXJRRDs7QUF1UUEsV0FBTztBQUNMLHNCQUFnQmlGLFFBQVE7QUFDdEJVLDBCQUFrQlYsSUFBbEI7QUFDQWUsMEJBQWtCZixJQUFsQjtBQUNBRCw0QkFBb0JDLElBQXBCO0FBQ0QsT0FMSTtBQU1MLGtDQUE0QkEsUUFBUTtBQUNsQ08sbUJBQVdQLElBQVgsRUFBaUJ0SCx3QkFBakI7QUFDRCxPQVJJO0FBU0wsZ0NBQTBCc0gsUUFBUTtBQUNoQ0EsYUFBS3RDLFVBQUwsQ0FBZ0IvRCxPQUFoQixDQUF3QjJDLGFBQWE7QUFDbkNpRSxxQkFBV1AsSUFBWCxFQUFpQjFELFVBQVV3RSxRQUFWLENBQW1CckgsSUFBcEM7QUFDRCxTQUZEO0FBR0FMLHFDQUE2QjRHLEtBQUszRyxXQUFsQyxFQUFnREksSUFBRCxJQUFVO0FBQ3ZEOEcscUJBQVdQLElBQVgsRUFBaUJ2RyxJQUFqQjtBQUNELFNBRkQ7QUFHRCxPQWhCSSxFQUFQOztBQWtCRCxHQTVnQmMsRUFBakIiLCJmaWxlIjoibm8tdW51c2VkLW1vZHVsZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlT3ZlcnZpZXcgRW5zdXJlcyB0aGF0IG1vZHVsZXMgY29udGFpbiBleHBvcnRzIGFuZC9vciBhbGxcbiAqIG1vZHVsZXMgYXJlIGNvbnN1bWVkIHdpdGhpbiBvdGhlciBtb2R1bGVzLlxuICogQGF1dGhvciBSZW7DqSBGZXJtYW5uXG4gKi9cblxuaW1wb3J0IEV4cG9ydHMsIHsgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUgfSBmcm9tICcuLi9FeHBvcnRNYXAnO1xuaW1wb3J0IHsgZ2V0RmlsZUV4dGVuc2lvbnMgfSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL2lnbm9yZSc7XG5pbXBvcnQgcmVzb2x2ZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3Jlc29sdmUnO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgcmVhZFBrZ1VwIGZyb20gJ3JlYWQtcGtnLXVwJztcbmltcG9ydCB2YWx1ZXMgZnJvbSAnb2JqZWN0LnZhbHVlcyc7XG5pbXBvcnQgaW5jbHVkZXMgZnJvbSAnYXJyYXktaW5jbHVkZXMnO1xuXG4vLyBlc2xpbnQvbGliL3V0aWwvZ2xvYi11dGlsIGhhcyBiZWVuIG1vdmVkIHRvIGVzbGludC9saWIvdXRpbC9nbG9iLXV0aWxzIHdpdGggdmVyc2lvbiA1LjNcbi8vIGFuZCBoYXMgYmVlbiBtb3ZlZCB0byBlc2xpbnQvbGliL2NsaS1lbmdpbmUvZmlsZS1lbnVtZXJhdG9yIGluIHZlcnNpb24gNlxubGV0IGxpc3RGaWxlc1RvUHJvY2VzcztcbnRyeSB7XG4gIGNvbnN0IEZpbGVFbnVtZXJhdG9yID0gcmVxdWlyZSgnZXNsaW50L2xpYi9jbGktZW5naW5lL2ZpbGUtZW51bWVyYXRvcicpLkZpbGVFbnVtZXJhdG9yO1xuICBsaXN0RmlsZXNUb1Byb2Nlc3MgPSBmdW5jdGlvbiAoc3JjLCBleHRlbnNpb25zKSB7XG4gICAgY29uc3QgZSA9IG5ldyBGaWxlRW51bWVyYXRvcih7XG4gICAgICBleHRlbnNpb25zOiBleHRlbnNpb25zLFxuICAgIH0pO1xuICAgIHJldHVybiBBcnJheS5mcm9tKGUuaXRlcmF0ZUZpbGVzKHNyYyksICh7IGZpbGVQYXRoLCBpZ25vcmVkIH0pID0+ICh7XG4gICAgICBpZ25vcmVkLFxuICAgICAgZmlsZW5hbWU6IGZpbGVQYXRoLFxuICAgIH0pKTtcbiAgfTtcbn0gY2F0Y2ggKGUxKSB7XG4gIC8vIFByZXZlbnQgcGFzc2luZyBpbnZhbGlkIG9wdGlvbnMgKGV4dGVuc2lvbnMgYXJyYXkpIHRvIG9sZCB2ZXJzaW9ucyBvZiB0aGUgZnVuY3Rpb24uXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9lc2xpbnQvZXNsaW50L2Jsb2IvdjUuMTYuMC9saWIvdXRpbC9nbG9iLXV0aWxzLmpzI0wxNzgtTDI4MFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZXNsaW50L2VzbGludC9ibG9iL3Y1LjIuMC9saWIvdXRpbC9nbG9iLXV0aWwuanMjTDE3NC1MMjY5XG4gIGxldCBvcmlnaW5hbExpc3RGaWxlc1RvUHJvY2VzcztcbiAgdHJ5IHtcbiAgICBvcmlnaW5hbExpc3RGaWxlc1RvUHJvY2VzcyA9IHJlcXVpcmUoJ2VzbGludC9saWIvdXRpbC9nbG9iLXV0aWxzJykubGlzdEZpbGVzVG9Qcm9jZXNzO1xuICAgIGxpc3RGaWxlc1RvUHJvY2VzcyA9IGZ1bmN0aW9uIChzcmMsIGV4dGVuc2lvbnMpIHtcbiAgICAgIHJldHVybiBvcmlnaW5hbExpc3RGaWxlc1RvUHJvY2VzcyhzcmMsIHtcbiAgICAgICAgZXh0ZW5zaW9uczogZXh0ZW5zaW9ucyxcbiAgICAgIH0pO1xuICAgIH07XG4gIH0gY2F0Y2ggKGUyKSB7XG4gICAgb3JpZ2luYWxMaXN0RmlsZXNUb1Byb2Nlc3MgPSByZXF1aXJlKCdlc2xpbnQvbGliL3V0aWwvZ2xvYi11dGlsJykubGlzdEZpbGVzVG9Qcm9jZXNzO1xuXG4gICAgbGlzdEZpbGVzVG9Qcm9jZXNzID0gZnVuY3Rpb24gKHNyYywgZXh0ZW5zaW9ucykge1xuICAgICAgY29uc3QgcGF0dGVybnMgPSBzcmMucmVkdWNlKChjYXJyeSwgcGF0dGVybikgPT4ge1xuICAgICAgICByZXR1cm4gY2FycnkuY29uY2F0KGV4dGVuc2lvbnMubWFwKChleHRlbnNpb24pID0+IHtcbiAgICAgICAgICByZXR1cm4gL1xcKlxcKnxcXCpcXC4vLnRlc3QocGF0dGVybikgPyBwYXR0ZXJuIDogYCR7cGF0dGVybn0vKiovKiR7ZXh0ZW5zaW9ufWA7XG4gICAgICAgIH0pKTtcbiAgICAgIH0sIHNyYy5zbGljZSgpKTtcblxuICAgICAgcmV0dXJuIG9yaWdpbmFsTGlzdEZpbGVzVG9Qcm9jZXNzKHBhdHRlcm5zKTtcbiAgICB9O1xuICB9XG59XG5cbmNvbnN0IEVYUE9SVF9ERUZBVUxUX0RFQ0xBUkFUSU9OID0gJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbic7XG5jb25zdCBFWFBPUlRfTkFNRURfREVDTEFSQVRJT04gPSAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic7XG5jb25zdCBFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OID0gJ0V4cG9ydEFsbERlY2xhcmF0aW9uJztcbmNvbnN0IElNUE9SVF9ERUNMQVJBVElPTiA9ICdJbXBvcnREZWNsYXJhdGlvbic7XG5jb25zdCBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiA9ICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInO1xuY29uc3QgSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSID0gJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInO1xuY29uc3QgVkFSSUFCTEVfREVDTEFSQVRJT04gPSAnVmFyaWFibGVEZWNsYXJhdGlvbic7XG5jb25zdCBGVU5DVElPTl9ERUNMQVJBVElPTiA9ICdGdW5jdGlvbkRlY2xhcmF0aW9uJztcbmNvbnN0IENMQVNTX0RFQ0xBUkFUSU9OID0gJ0NsYXNzRGVjbGFyYXRpb24nO1xuY29uc3QgSURFTlRJRklFUiA9ICdJZGVudGlmaWVyJztcbmNvbnN0IE9CSkVDVF9QQVRURVJOID0gJ09iamVjdFBhdHRlcm4nO1xuY29uc3QgVFNfSU5URVJGQUNFX0RFQ0xBUkFUSU9OID0gJ1RTSW50ZXJmYWNlRGVjbGFyYXRpb24nO1xuY29uc3QgVFNfVFlQRV9BTElBU19ERUNMQVJBVElPTiA9ICdUU1R5cGVBbGlhc0RlY2xhcmF0aW9uJztcbmNvbnN0IFRTX0VOVU1fREVDTEFSQVRJT04gPSAnVFNFbnVtRGVjbGFyYXRpb24nO1xuY29uc3QgREVGQVVMVCA9ICdkZWZhdWx0JztcblxuZnVuY3Rpb24gZm9yRWFjaERlY2xhcmF0aW9uSWRlbnRpZmllcihkZWNsYXJhdGlvbiwgY2IpIHtcbiAgaWYgKGRlY2xhcmF0aW9uKSB7XG4gICAgaWYgKFxuICAgICAgZGVjbGFyYXRpb24udHlwZSA9PT0gRlVOQ1RJT05fREVDTEFSQVRJT04gfHxcbiAgICAgIGRlY2xhcmF0aW9uLnR5cGUgPT09IENMQVNTX0RFQ0xBUkFUSU9OIHx8XG4gICAgICBkZWNsYXJhdGlvbi50eXBlID09PSBUU19JTlRFUkZBQ0VfREVDTEFSQVRJT04gfHxcbiAgICAgIGRlY2xhcmF0aW9uLnR5cGUgPT09IFRTX1RZUEVfQUxJQVNfREVDTEFSQVRJT04gfHxcbiAgICAgIGRlY2xhcmF0aW9uLnR5cGUgPT09IFRTX0VOVU1fREVDTEFSQVRJT05cbiAgICApIHtcbiAgICAgIGNiKGRlY2xhcmF0aW9uLmlkLm5hbWUpO1xuICAgIH0gZWxzZSBpZiAoZGVjbGFyYXRpb24udHlwZSA9PT0gVkFSSUFCTEVfREVDTEFSQVRJT04pIHtcbiAgICAgIGRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucy5mb3JFYWNoKCh7IGlkIH0pID0+IHtcbiAgICAgICAgaWYgKGlkLnR5cGUgPT09IE9CSkVDVF9QQVRURVJOKSB7XG4gICAgICAgICAgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUoaWQsIChwYXR0ZXJuKSA9PiB7XG4gICAgICAgICAgICBpZiAocGF0dGVybi50eXBlID09PSBJREVOVElGSUVSKSB7XG4gICAgICAgICAgICAgIGNiKHBhdHRlcm4ubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2IoaWQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIExpc3Qgb2YgaW1wb3J0cyBwZXIgZmlsZS5cbiAqXG4gKiBSZXByZXNlbnRlZCBieSBhIHR3by1sZXZlbCBNYXAgdG8gYSBTZXQgb2YgaWRlbnRpZmllcnMuIFRoZSB1cHBlci1sZXZlbCBNYXBcbiAqIGtleXMgYXJlIHRoZSBwYXRocyB0byB0aGUgbW9kdWxlcyBjb250YWluaW5nIHRoZSBpbXBvcnRzLCB3aGlsZSB0aGVcbiAqIGxvd2VyLWxldmVsIE1hcCBrZXlzIGFyZSB0aGUgcGF0aHMgdG8gdGhlIGZpbGVzIHdoaWNoIGFyZSBiZWluZyBpbXBvcnRlZFxuICogZnJvbS4gTGFzdGx5LCB0aGUgU2V0IG9mIGlkZW50aWZpZXJzIGNvbnRhaW5zIGVpdGhlciBuYW1lcyBiZWluZyBpbXBvcnRlZFxuICogb3IgYSBzcGVjaWFsIEFTVCBub2RlIG5hbWUgbGlzdGVkIGFib3ZlIChlLmcgSW1wb3J0RGVmYXVsdFNwZWNpZmllcikuXG4gKlxuICogRm9yIGV4YW1wbGUsIGlmIHdlIGhhdmUgYSBmaWxlIG5hbWVkIGZvby5qcyBjb250YWluaW5nOlxuICpcbiAqICAgaW1wb3J0IHsgbzIgfSBmcm9tICcuL2Jhci5qcyc7XG4gKlxuICogVGhlbiB3ZSB3aWxsIGhhdmUgYSBzdHJ1Y3R1cmUgdGhhdCBsb29rcyBsaWtlOlxuICpcbiAqICAgTWFwIHsgJ2Zvby5qcycgPT4gTWFwIHsgJ2Jhci5qcycgPT4gU2V0IHsgJ28yJyB9IH0gfVxuICpcbiAqIEB0eXBlIHtNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4+fVxuICovXG5jb25zdCBpbXBvcnRMaXN0ID0gbmV3IE1hcCgpO1xuXG4vKipcbiAqIExpc3Qgb2YgZXhwb3J0cyBwZXIgZmlsZS5cbiAqXG4gKiBSZXByZXNlbnRlZCBieSBhIHR3by1sZXZlbCBNYXAgdG8gYW4gb2JqZWN0IG9mIG1ldGFkYXRhLiBUaGUgdXBwZXItbGV2ZWwgTWFwXG4gKiBrZXlzIGFyZSB0aGUgcGF0aHMgdG8gdGhlIG1vZHVsZXMgY29udGFpbmluZyB0aGUgZXhwb3J0cywgd2hpbGUgdGhlXG4gKiBsb3dlci1sZXZlbCBNYXAga2V5cyBhcmUgdGhlIHNwZWNpZmljIGlkZW50aWZpZXJzIG9yIHNwZWNpYWwgQVNUIG5vZGUgbmFtZXNcbiAqIGJlaW5nIGV4cG9ydGVkLiBUaGUgbGVhZi1sZXZlbCBtZXRhZGF0YSBvYmplY3QgYXQgdGhlIG1vbWVudCBvbmx5IGNvbnRhaW5zIGFcbiAqIGB3aGVyZVVzZWRgIHByb3BlcnR5LCB3aGljaCBjb250YWlucyBhIFNldCBvZiBwYXRocyB0byBtb2R1bGVzIHRoYXQgaW1wb3J0XG4gKiB0aGUgbmFtZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgaWYgd2UgaGF2ZSBhIGZpbGUgbmFtZWQgYmFyLmpzIGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBleHBvcnRzOlxuICpcbiAqICAgY29uc3QgbzIgPSAnYmFyJztcbiAqICAgZXhwb3J0IHsgbzIgfTtcbiAqXG4gKiBBbmQgYSBmaWxlIG5hbWVkIGZvby5qcyBjb250YWluaW5nIHRoZSBmb2xsb3dpbmcgaW1wb3J0OlxuICpcbiAqICAgaW1wb3J0IHsgbzIgfSBmcm9tICcuL2Jhci5qcyc7XG4gKlxuICogVGhlbiB3ZSB3aWxsIGhhdmUgYSBzdHJ1Y3R1cmUgdGhhdCBsb29rcyBsaWtlOlxuICpcbiAqICAgTWFwIHsgJ2Jhci5qcycgPT4gTWFwIHsgJ28yJyA9PiB7IHdoZXJlVXNlZDogU2V0IHsgJ2Zvby5qcycgfSB9IH0gfVxuICpcbiAqIEB0eXBlIHtNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBvYmplY3Q+Pn1cbiAqL1xuY29uc3QgZXhwb3J0TGlzdCA9IG5ldyBNYXAoKTtcblxuY29uc3QgaWdub3JlZEZpbGVzID0gbmV3IFNldCgpO1xuY29uc3QgZmlsZXNPdXRzaWRlU3JjID0gbmV3IFNldCgpO1xuXG5jb25zdCBpc05vZGVNb2R1bGUgPSBwYXRoID0+IHtcbiAgcmV0dXJuIC9cXC8obm9kZV9tb2R1bGVzKVxcLy8udGVzdChwYXRoKTtcbn07XG5cbi8qKlxuICogcmVhZCBhbGwgZmlsZXMgbWF0Y2hpbmcgdGhlIHBhdHRlcm5zIGluIHNyYyBhbmQgaWdub3JlRXhwb3J0c1xuICpcbiAqIHJldHVybiBhbGwgZmlsZXMgbWF0Y2hpbmcgc3JjIHBhdHRlcm4sIHdoaWNoIGFyZSBub3QgbWF0Y2hpbmcgdGhlIGlnbm9yZUV4cG9ydHMgcGF0dGVyblxuICovXG5jb25zdCByZXNvbHZlRmlsZXMgPSAoc3JjLCBpZ25vcmVFeHBvcnRzLCBjb250ZXh0KSA9PiB7XG4gIGNvbnN0IGV4dGVuc2lvbnMgPSBBcnJheS5mcm9tKGdldEZpbGVFeHRlbnNpb25zKGNvbnRleHQuc2V0dGluZ3MpKTtcblxuICBjb25zdCBzcmNGaWxlcyA9IG5ldyBTZXQoKTtcbiAgY29uc3Qgc3JjRmlsZUxpc3QgPSBsaXN0RmlsZXNUb1Byb2Nlc3Moc3JjLCBleHRlbnNpb25zKTtcblxuICAvLyBwcmVwYXJlIGxpc3Qgb2YgaWdub3JlZCBmaWxlc1xuICBjb25zdCBpZ25vcmVkRmlsZXNMaXN0ID0gIGxpc3RGaWxlc1RvUHJvY2VzcyhpZ25vcmVFeHBvcnRzLCBleHRlbnNpb25zKTtcbiAgaWdub3JlZEZpbGVzTGlzdC5mb3JFYWNoKCh7IGZpbGVuYW1lIH0pID0+IGlnbm9yZWRGaWxlcy5hZGQoZmlsZW5hbWUpKTtcblxuICAvLyBwcmVwYXJlIGxpc3Qgb2Ygc291cmNlIGZpbGVzLCBkb24ndCBjb25zaWRlciBmaWxlcyBmcm9tIG5vZGVfbW9kdWxlc1xuICBzcmNGaWxlTGlzdC5maWx0ZXIoKHsgZmlsZW5hbWUgfSkgPT4gIWlzTm9kZU1vZHVsZShmaWxlbmFtZSkpLmZvckVhY2goKHsgZmlsZW5hbWUgfSkgPT4ge1xuICAgIHNyY0ZpbGVzLmFkZChmaWxlbmFtZSk7XG4gIH0pO1xuICByZXR1cm4gc3JjRmlsZXM7XG59O1xuXG4vKipcbiAqIHBhcnNlIGFsbCBzb3VyY2UgZmlsZXMgYW5kIGJ1aWxkIHVwIDIgbWFwcyBjb250YWluaW5nIHRoZSBleGlzdGluZyBpbXBvcnRzIGFuZCBleHBvcnRzXG4gKi9cbmNvbnN0IHByZXBhcmVJbXBvcnRzQW5kRXhwb3J0cyA9IChzcmNGaWxlcywgY29udGV4dCkgPT4ge1xuICBjb25zdCBleHBvcnRBbGwgPSBuZXcgTWFwKCk7XG4gIHNyY0ZpbGVzLmZvckVhY2goZmlsZSA9PiB7XG4gICAgY29uc3QgZXhwb3J0cyA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBpbXBvcnRzID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGN1cnJlbnRFeHBvcnRzID0gRXhwb3J0cy5nZXQoZmlsZSwgY29udGV4dCk7XG4gICAgaWYgKGN1cnJlbnRFeHBvcnRzKSB7XG4gICAgICBjb25zdCB7IGRlcGVuZGVuY2llcywgcmVleHBvcnRzLCBpbXBvcnRzOiBsb2NhbEltcG9ydExpc3QsIG5hbWVzcGFjZSAgfSA9IGN1cnJlbnRFeHBvcnRzO1xuXG4gICAgICAvLyBkZXBlbmRlbmNpZXMgPT09IGV4cG9ydCAqIGZyb21cbiAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnRBbGwgPSBuZXcgU2V0KCk7XG4gICAgICBkZXBlbmRlbmNpZXMuZm9yRWFjaChnZXREZXBlbmRlbmN5ID0+IHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IGdldERlcGVuZGVuY3koKTtcbiAgICAgICAgaWYgKGRlcGVuZGVuY3kgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50RXhwb3J0QWxsLmFkZChkZXBlbmRlbmN5LnBhdGgpO1xuICAgICAgfSk7XG4gICAgICBleHBvcnRBbGwuc2V0KGZpbGUsIGN1cnJlbnRFeHBvcnRBbGwpO1xuXG4gICAgICByZWV4cG9ydHMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAoa2V5ID09PSBERUZBVUxUKSB7XG4gICAgICAgICAgZXhwb3J0cy5zZXQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSLCB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWV4cG9ydCA9ICB2YWx1ZS5nZXRJbXBvcnQoKTtcbiAgICAgICAgaWYgKCFyZWV4cG9ydCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbG9jYWxJbXBvcnQgPSBpbXBvcnRzLmdldChyZWV4cG9ydC5wYXRoKTtcbiAgICAgICAgbGV0IGN1cnJlbnRWYWx1ZTtcbiAgICAgICAgaWYgKHZhbHVlLmxvY2FsID09PSBERUZBVUxUKSB7XG4gICAgICAgICAgY3VycmVudFZhbHVlID0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IHZhbHVlLmxvY2FsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbG9jYWxJbXBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWxJbXBvcnQgPSBuZXcgU2V0KFsuLi5sb2NhbEltcG9ydCwgY3VycmVudFZhbHVlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxJbXBvcnQgPSBuZXcgU2V0KFtjdXJyZW50VmFsdWVdKTtcbiAgICAgICAgfVxuICAgICAgICBpbXBvcnRzLnNldChyZWV4cG9ydC5wYXRoLCBsb2NhbEltcG9ydCk7XG4gICAgICB9KTtcblxuICAgICAgbG9jYWxJbXBvcnRMaXN0LmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKGlzTm9kZU1vZHVsZShrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxvY2FsSW1wb3J0ID0gaW1wb3J0cy5nZXQoa2V5KSB8fCBuZXcgU2V0KCk7XG4gICAgICAgIHZhbHVlLmRlY2xhcmF0aW9ucy5mb3JFYWNoKCh7IGltcG9ydGVkU3BlY2lmaWVycyB9KSA9PlxuICAgICAgICAgIGltcG9ydGVkU3BlY2lmaWVycy5mb3JFYWNoKHNwZWNpZmllciA9PiBsb2NhbEltcG9ydC5hZGQoc3BlY2lmaWVyKSlcbiAgICAgICAgKTtcbiAgICAgICAgaW1wb3J0cy5zZXQoa2V5LCBsb2NhbEltcG9ydCk7XG4gICAgICB9KTtcbiAgICAgIGltcG9ydExpc3Quc2V0KGZpbGUsIGltcG9ydHMpO1xuXG4gICAgICAvLyBidWlsZCB1cCBleHBvcnQgbGlzdCBvbmx5LCBpZiBmaWxlIGlzIG5vdCBpZ25vcmVkXG4gICAgICBpZiAoaWdub3JlZEZpbGVzLmhhcyhmaWxlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBuYW1lc3BhY2UuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAoa2V5ID09PSBERUZBVUxUKSB7XG4gICAgICAgICAgZXhwb3J0cy5zZXQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSLCB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGV4cG9ydHMuc2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04sIHsgd2hlcmVVc2VkOiBuZXcgU2V0KCkgfSk7XG4gICAgZXhwb3J0cy5zZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIsIHsgd2hlcmVVc2VkOiBuZXcgU2V0KCkgfSk7XG4gICAgZXhwb3J0TGlzdC5zZXQoZmlsZSwgZXhwb3J0cyk7XG4gIH0pO1xuICBleHBvcnRBbGwuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgIHZhbHVlLmZvckVhY2godmFsID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnRzID0gZXhwb3J0TGlzdC5nZXQodmFsKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnQgPSBjdXJyZW50RXhwb3J0cy5nZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTik7XG4gICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5hZGQoa2V5KTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIHRyYXZlcnNlIHRocm91Z2ggYWxsIGltcG9ydHMgYW5kIGFkZCB0aGUgcmVzcGVjdGl2ZSBwYXRoIHRvIHRoZSB3aGVyZVVzZWQtbGlzdFxuICogb2YgdGhlIGNvcnJlc3BvbmRpbmcgZXhwb3J0XG4gKi9cbmNvbnN0IGRldGVybWluZVVzYWdlID0gKCkgPT4ge1xuICBpbXBvcnRMaXN0LmZvckVhY2goKGxpc3RWYWx1ZSwgbGlzdEtleSkgPT4ge1xuICAgIGxpc3RWYWx1ZS5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBjb25zdCBleHBvcnRzID0gZXhwb3J0TGlzdC5nZXQoa2V5KTtcbiAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFsdWUuZm9yRWFjaChjdXJyZW50SW1wb3J0ID0+IHtcbiAgICAgICAgICBsZXQgc3BlY2lmaWVyO1xuICAgICAgICAgIGlmIChjdXJyZW50SW1wb3J0ID09PSBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUikge1xuICAgICAgICAgICAgc3BlY2lmaWVyID0gSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVI7XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SW1wb3J0ID09PSBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpIHtcbiAgICAgICAgICAgIHNwZWNpZmllciA9IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3BlY2lmaWVyID0gY3VycmVudEltcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBzcGVjaWZpZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRTdGF0ZW1lbnQgPSBleHBvcnRzLmdldChzcGVjaWZpZXIpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRTdGF0ZW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHsgd2hlcmVVc2VkIH0gPSBleHBvcnRTdGF0ZW1lbnQ7XG4gICAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQobGlzdEtleSk7XG4gICAgICAgICAgICAgIGV4cG9ydHMuc2V0KHNwZWNpZmllciwgeyB3aGVyZVVzZWQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59O1xuXG5jb25zdCBnZXRTcmMgPSBzcmMgPT4ge1xuICBpZiAoc3JjKSB7XG4gICAgcmV0dXJuIHNyYztcbiAgfVxuICByZXR1cm4gW3Byb2Nlc3MuY3dkKCldO1xufTtcblxuLyoqXG4gKiBwcmVwYXJlIHRoZSBsaXN0cyBvZiBleGlzdGluZyBpbXBvcnRzIGFuZCBleHBvcnRzIC0gc2hvdWxkIG9ubHkgYmUgZXhlY3V0ZWQgb25jZSBhdFxuICogdGhlIHN0YXJ0IG9mIGEgbmV3IGVzbGludCBydW5cbiAqL1xubGV0IHNyY0ZpbGVzO1xubGV0IGxhc3RQcmVwYXJlS2V5O1xuY29uc3QgZG9QcmVwYXJhdGlvbiA9IChzcmMsIGlnbm9yZUV4cG9ydHMsIGNvbnRleHQpID0+IHtcbiAgY29uc3QgcHJlcGFyZUtleSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICBzcmM6IChzcmMgfHwgW10pLnNvcnQoKSxcbiAgICBpZ25vcmVFeHBvcnRzOiAoaWdub3JlRXhwb3J0cyB8fCBbXSkuc29ydCgpLFxuICAgIGV4dGVuc2lvbnM6IEFycmF5LmZyb20oZ2V0RmlsZUV4dGVuc2lvbnMoY29udGV4dC5zZXR0aW5ncykpLnNvcnQoKSxcbiAgfSk7XG4gIGlmIChwcmVwYXJlS2V5ID09PSBsYXN0UHJlcGFyZUtleSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGltcG9ydExpc3QuY2xlYXIoKTtcbiAgZXhwb3J0TGlzdC5jbGVhcigpO1xuICBpZ25vcmVkRmlsZXMuY2xlYXIoKTtcbiAgZmlsZXNPdXRzaWRlU3JjLmNsZWFyKCk7XG5cbiAgc3JjRmlsZXMgPSByZXNvbHZlRmlsZXMoZ2V0U3JjKHNyYyksIGlnbm9yZUV4cG9ydHMsIGNvbnRleHQpO1xuICBwcmVwYXJlSW1wb3J0c0FuZEV4cG9ydHMoc3JjRmlsZXMsIGNvbnRleHQpO1xuICBkZXRlcm1pbmVVc2FnZSgpO1xuICBsYXN0UHJlcGFyZUtleSA9IHByZXBhcmVLZXk7XG59O1xuXG5jb25zdCBuZXdOYW1lc3BhY2VJbXBvcnRFeGlzdHMgPSBzcGVjaWZpZXJzID0+XG4gIHNwZWNpZmllcnMuc29tZSgoeyB0eXBlIH0pID0+IHR5cGUgPT09IElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcblxuY29uc3QgbmV3RGVmYXVsdEltcG9ydEV4aXN0cyA9IHNwZWNpZmllcnMgPT5cbiAgc3BlY2lmaWVycy5zb21lKCh7IHR5cGUgfSkgPT4gdHlwZSA9PT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKTtcblxuY29uc3QgZmlsZUlzSW5Qa2cgPSBmaWxlID0+IHtcbiAgY29uc3QgeyBwYXRoLCBwa2cgfSA9IHJlYWRQa2dVcC5zeW5jKHsgY3dkOiBmaWxlLCBub3JtYWxpemU6IGZhbHNlIH0pO1xuICBjb25zdCBiYXNlUGF0aCA9IGRpcm5hbWUocGF0aCk7XG5cbiAgY29uc3QgY2hlY2tQa2dGaWVsZFN0cmluZyA9IHBrZ0ZpZWxkID0+IHtcbiAgICBpZiAoam9pbihiYXNlUGF0aCwgcGtnRmllbGQpID09PSBmaWxlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgY2hlY2tQa2dGaWVsZE9iamVjdCA9IHBrZ0ZpZWxkID0+IHtcbiAgICBjb25zdCBwa2dGaWVsZEZpbGVzID0gdmFsdWVzKHBrZ0ZpZWxkKS5tYXAodmFsdWUgPT4gam9pbihiYXNlUGF0aCwgdmFsdWUpKTtcbiAgICBpZiAoaW5jbHVkZXMocGtnRmllbGRGaWxlcywgZmlsZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBjaGVja1BrZ0ZpZWxkID0gcGtnRmllbGQgPT4ge1xuICAgIGlmICh0eXBlb2YgcGtnRmllbGQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gY2hlY2tQa2dGaWVsZFN0cmluZyhwa2dGaWVsZCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwa2dGaWVsZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBjaGVja1BrZ0ZpZWxkT2JqZWN0KHBrZ0ZpZWxkKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHBrZy5wcml2YXRlID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHBrZy5iaW4pIHtcbiAgICBpZiAoY2hlY2tQa2dGaWVsZChwa2cuYmluKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKHBrZy5icm93c2VyKSB7XG4gICAgaWYgKGNoZWNrUGtnRmllbGQocGtnLmJyb3dzZXIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAocGtnLm1haW4pIHtcbiAgICBpZiAoY2hlY2tQa2dGaWVsZFN0cmluZyhwa2cubWFpbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHsgdXJsOiBkb2NzVXJsKCduby11bnVzZWQtbW9kdWxlcycpIH0sXG4gICAgc2NoZW1hOiBbe1xuICAgICAgcHJvcGVydGllczoge1xuICAgICAgICBzcmM6IHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ2ZpbGVzL3BhdGhzIHRvIGJlIGFuYWx5emVkIChvbmx5IGZvciB1bnVzZWQgZXhwb3J0cyknLFxuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgbWluSXRlbXM6IDEsXG4gICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgbWluTGVuZ3RoOiAxLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGlnbm9yZUV4cG9ydHM6IHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAgICdmaWxlcy9wYXRocyBmb3Igd2hpY2ggdW51c2VkIGV4cG9ydHMgd2lsbCBub3QgYmUgcmVwb3J0ZWQgKGUuZyBtb2R1bGUgZW50cnkgcG9pbnRzKScsXG4gICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICBtaW5JdGVtczogMSxcbiAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBtaW5MZW5ndGg6IDEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWlzc2luZ0V4cG9ydHM6IHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ3JlcG9ydCBtb2R1bGVzIHdpdGhvdXQgYW55IGV4cG9ydHMnLFxuICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgfSxcbiAgICAgICAgdW51c2VkRXhwb3J0czoge1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAncmVwb3J0IGV4cG9ydHMgd2l0aG91dCBhbnkgdXNhZ2UnLFxuICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBub3Q6IHtcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHVudXNlZEV4cG9ydHM6IHsgZW51bTogW2ZhbHNlXSB9LFxuICAgICAgICAgIG1pc3NpbmdFeHBvcnRzOiB7IGVudW06IFtmYWxzZV0gfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBhbnlPZjpbe1xuICAgICAgICBub3Q6IHtcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICB1bnVzZWRFeHBvcnRzOiB7IGVudW06IFt0cnVlXSB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ21pc3NpbmdFeHBvcnRzJ10sXG4gICAgICB9LCB7XG4gICAgICAgIG5vdDoge1xuICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIG1pc3NpbmdFeHBvcnRzOiB7IGVudW06IFt0cnVlXSB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3VudXNlZEV4cG9ydHMnXSxcbiAgICAgIH0sIHtcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHVudXNlZEV4cG9ydHM6IHsgZW51bTogW3RydWVdIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3VudXNlZEV4cG9ydHMnXSxcbiAgICAgIH0sIHtcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIG1pc3NpbmdFeHBvcnRzOiB7IGVudW06IFt0cnVlXSB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydtaXNzaW5nRXhwb3J0cyddLFxuICAgICAgfV0sXG4gICAgfV0sXG4gIH0sXG5cbiAgY3JlYXRlOiBjb250ZXh0ID0+IHtcbiAgICBjb25zdCB7XG4gICAgICBzcmMsXG4gICAgICBpZ25vcmVFeHBvcnRzID0gW10sXG4gICAgICBtaXNzaW5nRXhwb3J0cyxcbiAgICAgIHVudXNlZEV4cG9ydHMsXG4gICAgfSA9IGNvbnRleHQub3B0aW9uc1swXSB8fCB7fTtcblxuICAgIGlmICh1bnVzZWRFeHBvcnRzKSB7XG4gICAgICBkb1ByZXBhcmF0aW9uKHNyYywgaWdub3JlRXhwb3J0cywgY29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IGNvbnRleHQuZ2V0RmlsZW5hbWUoKTtcblxuICAgIGNvbnN0IGNoZWNrRXhwb3J0UHJlc2VuY2UgPSBub2RlID0+IHtcbiAgICAgIGlmICghbWlzc2luZ0V4cG9ydHMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaWdub3JlZEZpbGVzLmhhcyhmaWxlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGV4cG9ydENvdW50ID0gZXhwb3J0TGlzdC5nZXQoZmlsZSk7XG4gICAgICBjb25zdCBleHBvcnRBbGwgPSBleHBvcnRDb3VudC5nZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTik7XG4gICAgICBjb25zdCBuYW1lc3BhY2VJbXBvcnRzID0gZXhwb3J0Q291bnQuZ2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcblxuICAgICAgZXhwb3J0Q291bnQuZGVsZXRlKEVYUE9SVF9BTExfREVDTEFSQVRJT04pO1xuICAgICAgZXhwb3J0Q291bnQuZGVsZXRlKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcbiAgICAgIGlmIChleHBvcnRDb3VudC5zaXplIDwgMSkge1xuICAgICAgICAvLyBub2RlLmJvZHlbMF0gPT09ICd1bmRlZmluZWQnIG9ubHkgaGFwcGVucywgaWYgZXZlcnl0aGluZyBpcyBjb21tZW50ZWQgb3V0IGluIHRoZSBmaWxlXG4gICAgICAgIC8vIGJlaW5nIGxpbnRlZFxuICAgICAgICBjb250ZXh0LnJlcG9ydChub2RlLmJvZHlbMF0gPyBub2RlLmJvZHlbMF0gOiBub2RlLCAnTm8gZXhwb3J0cyBmb3VuZCcpO1xuICAgICAgfVxuICAgICAgZXhwb3J0Q291bnQuc2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04sIGV4cG9ydEFsbCk7XG4gICAgICBleHBvcnRDb3VudC5zZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIsIG5hbWVzcGFjZUltcG9ydHMpO1xuICAgIH07XG5cbiAgICBjb25zdCBjaGVja1VzYWdlID0gKG5vZGUsIGV4cG9ydGVkVmFsdWUpID0+IHtcbiAgICAgIGlmICghdW51c2VkRXhwb3J0cykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChpZ25vcmVkRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpbGVJc0luUGtnKGZpbGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpbGVzT3V0c2lkZVNyYy5oYXMoZmlsZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBtYWtlIHN1cmUgZmlsZSB0byBiZSBsaW50ZWQgaXMgaW5jbHVkZWQgaW4gc291cmNlIGZpbGVzXG4gICAgICBpZiAoIXNyY0ZpbGVzLmhhcyhmaWxlKSkge1xuICAgICAgICBzcmNGaWxlcyA9IHJlc29sdmVGaWxlcyhnZXRTcmMoc3JjKSwgaWdub3JlRXhwb3J0cywgY29udGV4dCk7XG4gICAgICAgIGlmICghc3JjRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgICAgZmlsZXNPdXRzaWRlU3JjLmFkZChmaWxlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KGZpbGUpO1xuXG4gICAgICAvLyBzcGVjaWFsIGNhc2U6IGV4cG9ydCAqIGZyb21cbiAgICAgIGNvbnN0IGV4cG9ydEFsbCA9IGV4cG9ydHMuZ2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04pO1xuICAgICAgaWYgKHR5cGVvZiBleHBvcnRBbGwgIT09ICd1bmRlZmluZWQnICYmIGV4cG9ydGVkVmFsdWUgIT09IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUikge1xuICAgICAgICBpZiAoZXhwb3J0QWxsLndoZXJlVXNlZC5zaXplID4gMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBzcGVjaWFsIGNhc2U6IG5hbWVzcGFjZSBpbXBvcnRcbiAgICAgIGNvbnN0IG5hbWVzcGFjZUltcG9ydHMgPSBleHBvcnRzLmdldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUik7XG4gICAgICBpZiAodHlwZW9mIG5hbWVzcGFjZUltcG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2VJbXBvcnRzLndoZXJlVXNlZC5zaXplID4gMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBleHBvcnRzTGlzdCB3aWxsIGFsd2F5cyBtYXAgYW55IGltcG9ydGVkIHZhbHVlIG9mICdkZWZhdWx0JyB0byAnSW1wb3J0RGVmYXVsdFNwZWNpZmllcidcbiAgICAgIGNvbnN0IGV4cG9ydHNLZXkgPSBleHBvcnRlZFZhbHVlID09PSBERUZBVUxUID8gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSIDogZXhwb3J0ZWRWYWx1ZTtcblxuICAgICAgY29uc3QgZXhwb3J0U3RhdGVtZW50ID0gZXhwb3J0cy5nZXQoZXhwb3J0c0tleSk7XG5cbiAgICAgIGNvbnN0IHZhbHVlID0gZXhwb3J0c0tleSA9PT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSID8gREVGQVVMVCA6IGV4cG9ydHNLZXk7XG5cbiAgICAgIGlmICh0eXBlb2YgZXhwb3J0U3RhdGVtZW50ICE9PSAndW5kZWZpbmVkJyl7XG4gICAgICAgIGlmIChleHBvcnRTdGF0ZW1lbnQud2hlcmVVc2VkLnNpemUgPCAxKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoXG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgYGV4cG9ydGVkIGRlY2xhcmF0aW9uICcke3ZhbHVlfScgbm90IHVzZWQgd2l0aGluIG90aGVyIG1vZHVsZXNgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBgZXhwb3J0ZWQgZGVjbGFyYXRpb24gJyR7dmFsdWV9JyBub3QgdXNlZCB3aXRoaW4gb3RoZXIgbW9kdWxlc2BcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogb25seSB1c2VmdWwgZm9yIHRvb2xzIGxpa2UgdnNjb2RlLWVzbGludFxuICAgICAqXG4gICAgICogdXBkYXRlIGxpc3RzIG9mIGV4aXN0aW5nIGV4cG9ydHMgZHVyaW5nIHJ1bnRpbWVcbiAgICAgKi9cbiAgICBjb25zdCB1cGRhdGVFeHBvcnRVc2FnZSA9IG5vZGUgPT4ge1xuICAgICAgaWYgKGlnbm9yZWRGaWxlcy5oYXMoZmlsZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsZXQgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KGZpbGUpO1xuXG4gICAgICAvLyBuZXcgbW9kdWxlIGhhcyBiZWVuIGNyZWF0ZWQgZHVyaW5nIHJ1bnRpbWVcbiAgICAgIC8vIGluY2x1ZGUgaXQgaW4gZnVydGhlciBwcm9jZXNzaW5nXG4gICAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGV4cG9ydHMgPSBuZXcgTWFwKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld0V4cG9ydHMgPSBuZXcgTWFwKCk7XG4gICAgICBjb25zdCBuZXdFeHBvcnRJZGVudGlmaWVycyA9IG5ldyBTZXQoKTtcblxuICAgICAgbm9kZS5ib2R5LmZvckVhY2goKHsgdHlwZSwgZGVjbGFyYXRpb24sIHNwZWNpZmllcnMgfSkgPT4ge1xuICAgICAgICBpZiAodHlwZSA9PT0gRVhQT1JUX0RFRkFVTFRfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICBuZXdFeHBvcnRJZGVudGlmaWVycy5hZGQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gRVhQT1JUX05BTUVEX0RFQ0xBUkFUSU9OKSB7XG4gICAgICAgICAgaWYgKHNwZWNpZmllcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3BlY2lmaWVycy5mb3JFYWNoKHNwZWNpZmllciA9PiB7XG4gICAgICAgICAgICAgIGlmIChzcGVjaWZpZXIuZXhwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICBuZXdFeHBvcnRJZGVudGlmaWVycy5hZGQoc3BlY2lmaWVyLmV4cG9ydGVkLm5hbWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yRWFjaERlY2xhcmF0aW9uSWRlbnRpZmllcihkZWNsYXJhdGlvbiwgKG5hbWUpID0+IHtcbiAgICAgICAgICAgIG5ld0V4cG9ydElkZW50aWZpZXJzLmFkZChuYW1lKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIG9sZCBleHBvcnRzIGV4aXN0IHdpdGhpbiBsaXN0IG9mIG5ldyBleHBvcnRzIGlkZW50aWZpZXJzOiBhZGQgdG8gbWFwIG9mIG5ldyBleHBvcnRzXG4gICAgICBleHBvcnRzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKG5ld0V4cG9ydElkZW50aWZpZXJzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgbmV3RXhwb3J0cy5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBuZXcgZXhwb3J0IGlkZW50aWZpZXJzIGFkZGVkOiBhZGQgdG8gbWFwIG9mIG5ldyBleHBvcnRzXG4gICAgICBuZXdFeHBvcnRJZGVudGlmaWVycy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGlmICghZXhwb3J0cy5oYXMoa2V5KSkge1xuICAgICAgICAgIG5ld0V4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIHByZXNlcnZlIGluZm9ybWF0aW9uIGFib3V0IG5hbWVzcGFjZSBpbXBvcnRzXG4gICAgICBjb25zdCBleHBvcnRBbGwgPSBleHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKTtcbiAgICAgIGxldCBuYW1lc3BhY2VJbXBvcnRzID0gZXhwb3J0cy5nZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpO1xuXG4gICAgICBpZiAodHlwZW9mIG5hbWVzcGFjZUltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG5hbWVzcGFjZUltcG9ydHMgPSB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH07XG4gICAgICB9XG5cbiAgICAgIG5ld0V4cG9ydHMuc2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04sIGV4cG9ydEFsbCk7XG4gICAgICBuZXdFeHBvcnRzLnNldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiwgbmFtZXNwYWNlSW1wb3J0cyk7XG4gICAgICBleHBvcnRMaXN0LnNldChmaWxlLCBuZXdFeHBvcnRzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogb25seSB1c2VmdWwgZm9yIHRvb2xzIGxpa2UgdnNjb2RlLWVzbGludFxuICAgICAqXG4gICAgICogdXBkYXRlIGxpc3RzIG9mIGV4aXN0aW5nIGltcG9ydHMgZHVyaW5nIHJ1bnRpbWVcbiAgICAgKi9cbiAgICBjb25zdCB1cGRhdGVJbXBvcnRVc2FnZSA9IG5vZGUgPT4ge1xuICAgICAgaWYgKCF1bnVzZWRFeHBvcnRzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGV0IG9sZEltcG9ydFBhdGhzID0gaW1wb3J0TGlzdC5nZXQoZmlsZSk7XG4gICAgICBpZiAodHlwZW9mIG9sZEltcG9ydFBhdGhzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBvbGRJbXBvcnRQYXRocyA9IG5ldyBNYXAoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb2xkTmFtZXNwYWNlSW1wb3J0cyA9IG5ldyBTZXQoKTtcbiAgICAgIGNvbnN0IG5ld05hbWVzcGFjZUltcG9ydHMgPSBuZXcgU2V0KCk7XG5cbiAgICAgIGNvbnN0IG9sZEV4cG9ydEFsbCA9IG5ldyBTZXQoKTtcbiAgICAgIGNvbnN0IG5ld0V4cG9ydEFsbCA9IG5ldyBTZXQoKTtcblxuICAgICAgY29uc3Qgb2xkRGVmYXVsdEltcG9ydHMgPSBuZXcgU2V0KCk7XG4gICAgICBjb25zdCBuZXdEZWZhdWx0SW1wb3J0cyA9IG5ldyBTZXQoKTtcblxuICAgICAgY29uc3Qgb2xkSW1wb3J0cyA9IG5ldyBNYXAoKTtcbiAgICAgIGNvbnN0IG5ld0ltcG9ydHMgPSBuZXcgTWFwKCk7XG4gICAgICBvbGRJbXBvcnRQYXRocy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIGlmICh2YWx1ZS5oYXMoRVhQT1JUX0FMTF9ERUNMQVJBVElPTikpIHtcbiAgICAgICAgICBvbGRFeHBvcnRBbGwuYWRkKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlLmhhcyhJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUikpIHtcbiAgICAgICAgICBvbGROYW1lc3BhY2VJbXBvcnRzLmFkZChrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZS5oYXMoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKSkge1xuICAgICAgICAgIG9sZERlZmF1bHRJbXBvcnRzLmFkZChrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlLmZvckVhY2godmFsID0+IHtcbiAgICAgICAgICBpZiAodmFsICE9PSBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiAmJlxuICAgICAgICAgICAgICB2YWwgIT09IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUikge1xuICAgICAgICAgICAgb2xkSW1wb3J0cy5zZXQodmFsLCBrZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgbm9kZS5ib2R5LmZvckVhY2goYXN0Tm9kZSA9PiB7XG4gICAgICAgIGxldCByZXNvbHZlZFBhdGg7XG5cbiAgICAgICAgLy8gc3VwcG9ydCBmb3IgZXhwb3J0IHsgdmFsdWUgfSBmcm9tICdtb2R1bGUnXG4gICAgICAgIGlmIChhc3ROb2RlLnR5cGUgPT09IEVYUE9SVF9OQU1FRF9ERUNMQVJBVElPTikge1xuICAgICAgICAgIGlmIChhc3ROb2RlLnNvdXJjZSkge1xuICAgICAgICAgICAgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZShhc3ROb2RlLnNvdXJjZS5yYXcucmVwbGFjZSgvKCd8XCIpL2csICcnKSwgY29udGV4dCk7XG4gICAgICAgICAgICBhc3ROb2RlLnNwZWNpZmllcnMuZm9yRWFjaChzcGVjaWZpZXIgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBuYW1lID0gc3BlY2lmaWVyLmxvY2FsLm5hbWU7XG4gICAgICAgICAgICAgIGlmIChzcGVjaWZpZXIubG9jYWwubmFtZSA9PT0gREVGQVVMVCkge1xuICAgICAgICAgICAgICAgIG5ld0RlZmF1bHRJbXBvcnRzLmFkZChyZXNvbHZlZFBhdGgpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5ld0ltcG9ydHMuc2V0KG5hbWUsIHJlc29sdmVkUGF0aCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3ROb2RlLnR5cGUgPT09IEVYUE9SVF9BTExfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICByZXNvbHZlZFBhdGggPSByZXNvbHZlKGFzdE5vZGUuc291cmNlLnJhdy5yZXBsYWNlKC8oJ3xcIikvZywgJycpLCBjb250ZXh0KTtcbiAgICAgICAgICBuZXdFeHBvcnRBbGwuYWRkKHJlc29sdmVkUGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXN0Tm9kZS50eXBlID09PSBJTVBPUlRfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICByZXNvbHZlZFBhdGggPSByZXNvbHZlKGFzdE5vZGUuc291cmNlLnJhdy5yZXBsYWNlKC8oJ3xcIikvZywgJycpLCBjb250ZXh0KTtcbiAgICAgICAgICBpZiAoIXJlc29sdmVkUGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpc05vZGVNb2R1bGUocmVzb2x2ZWRQYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChuZXdOYW1lc3BhY2VJbXBvcnRFeGlzdHMoYXN0Tm9kZS5zcGVjaWZpZXJzKSkge1xuICAgICAgICAgICAgbmV3TmFtZXNwYWNlSW1wb3J0cy5hZGQocmVzb2x2ZWRQYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAobmV3RGVmYXVsdEltcG9ydEV4aXN0cyhhc3ROb2RlLnNwZWNpZmllcnMpKSB7XG4gICAgICAgICAgICBuZXdEZWZhdWx0SW1wb3J0cy5hZGQocmVzb2x2ZWRQYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhc3ROb2RlLnNwZWNpZmllcnMuZm9yRWFjaChzcGVjaWZpZXIgPT4ge1xuICAgICAgICAgICAgaWYgKHNwZWNpZmllci50eXBlID09PSBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIgfHxcbiAgICAgICAgICAgICAgICBzcGVjaWZpZXIudHlwZSA9PT0gSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3SW1wb3J0cy5zZXQoc3BlY2lmaWVyLmltcG9ydGVkLm5hbWUsIHJlc29sdmVkUGF0aCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBuZXdFeHBvcnRBbGwuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgIGlmICghb2xkRXhwb3J0QWxsLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBsZXQgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBpbXBvcnRzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaW1wb3J0cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaW1wb3J0cy5hZGQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTik7XG4gICAgICAgICAgb2xkSW1wb3J0UGF0aHMuc2V0KHZhbHVlLCBpbXBvcnRzKTtcblxuICAgICAgICAgIGxldCBleHBvcnRzID0gZXhwb3J0TGlzdC5nZXQodmFsdWUpO1xuICAgICAgICAgIGxldCBjdXJyZW50RXhwb3J0O1xuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGV4cG9ydExpc3Quc2V0KHZhbHVlLCBleHBvcnRzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5hZGQoZmlsZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHdoZXJlVXNlZCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQoZmlsZSk7XG4gICAgICAgICAgICBleHBvcnRzLnNldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OLCB7IHdoZXJlVXNlZCB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBvbGRFeHBvcnRBbGwuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgIGlmICghbmV3RXhwb3J0QWxsLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBpbXBvcnRzID0gb2xkSW1wb3J0UGF0aHMuZ2V0KHZhbHVlKTtcbiAgICAgICAgICBpbXBvcnRzLmRlbGV0ZShFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKTtcblxuICAgICAgICAgIGNvbnN0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04pO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5kZWxldGUoZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgbmV3RGVmYXVsdEltcG9ydHMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgIGlmICghb2xkRGVmYXVsdEltcG9ydHMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgIGxldCBpbXBvcnRzID0gb2xkSW1wb3J0UGF0aHMuZ2V0KHZhbHVlKTtcbiAgICAgICAgICBpZiAodHlwZW9mIGltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbXBvcnRzID0gbmV3IFNldCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpbXBvcnRzLmFkZChJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpO1xuICAgICAgICAgIG9sZEltcG9ydFBhdGhzLnNldCh2YWx1ZSwgaW1wb3J0cyk7XG5cbiAgICAgICAgICBsZXQgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKTtcbiAgICAgICAgICBsZXQgY3VycmVudEV4cG9ydDtcbiAgICAgICAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0ID0gZXhwb3J0cy5nZXQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGV4cG9ydExpc3Quc2V0KHZhbHVlLCBleHBvcnRzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5hZGQoZmlsZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHdoZXJlVXNlZCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQoZmlsZSk7XG4gICAgICAgICAgICBleHBvcnRzLnNldChJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIsIHsgd2hlcmVVc2VkIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIG9sZERlZmF1bHRJbXBvcnRzLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgICBpZiAoIW5ld0RlZmF1bHRJbXBvcnRzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBpbXBvcnRzID0gb2xkSW1wb3J0UGF0aHMuZ2V0KHZhbHVlKTtcbiAgICAgICAgICBpbXBvcnRzLmRlbGV0ZShJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpO1xuXG4gICAgICAgICAgY29uc3QgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKTtcbiAgICAgICAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50RXhwb3J0ID0gZXhwb3J0cy5nZXQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuZGVsZXRlKGZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIG5ld05hbWVzcGFjZUltcG9ydHMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgIGlmICghb2xkTmFtZXNwYWNlSW1wb3J0cy5oYXModmFsdWUpKSB7XG4gICAgICAgICAgbGV0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpO1xuICAgICAgICAgIGlmICh0eXBlb2YgaW1wb3J0cyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGltcG9ydHMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcbiAgICAgICAgICBvbGRJbXBvcnRQYXRocy5zZXQodmFsdWUsIGltcG9ydHMpO1xuXG4gICAgICAgICAgbGV0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgbGV0IGN1cnJlbnRFeHBvcnQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGV4cG9ydExpc3Quc2V0KHZhbHVlLCBleHBvcnRzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5hZGQoZmlsZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHdoZXJlVXNlZCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQoZmlsZSk7XG4gICAgICAgICAgICBleHBvcnRzLnNldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiwgeyB3aGVyZVVzZWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgb2xkTmFtZXNwYWNlSW1wb3J0cy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICAgICAgaWYgKCFuZXdOYW1lc3BhY2VJbXBvcnRzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBpbXBvcnRzID0gb2xkSW1wb3J0UGF0aHMuZ2V0KHZhbHVlKTtcbiAgICAgICAgICBpbXBvcnRzLmRlbGV0ZShJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUik7XG5cbiAgICAgICAgICBjb25zdCBleHBvcnRzID0gZXhwb3J0TGlzdC5nZXQodmFsdWUpO1xuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUik7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmRlbGV0ZShmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBuZXdJbXBvcnRzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKCFvbGRJbXBvcnRzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgbGV0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpO1xuICAgICAgICAgIGlmICh0eXBlb2YgaW1wb3J0cyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGltcG9ydHMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKGtleSk7XG4gICAgICAgICAgb2xkSW1wb3J0UGF0aHMuc2V0KHZhbHVlLCBpbXBvcnRzKTtcblxuICAgICAgICAgIGxldCBleHBvcnRzID0gZXhwb3J0TGlzdC5nZXQodmFsdWUpO1xuICAgICAgICAgIGxldCBjdXJyZW50RXhwb3J0O1xuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChrZXkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgZXhwb3J0TGlzdC5zZXQodmFsdWUsIGV4cG9ydHMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmFkZChmaWxlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgd2hlcmVVc2VkID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgd2hlcmVVc2VkLmFkZChmaWxlKTtcbiAgICAgICAgICAgIGV4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgb2xkSW1wb3J0cy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIGlmICghbmV3SW1wb3J0cy5oYXMoa2V5KSkge1xuICAgICAgICAgIGNvbnN0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpO1xuICAgICAgICAgIGltcG9ydHMuZGVsZXRlKGtleSk7XG5cbiAgICAgICAgICBjb25zdCBleHBvcnRzID0gZXhwb3J0TGlzdC5nZXQodmFsdWUpO1xuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChrZXkpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5kZWxldGUoZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICdQcm9ncmFtOmV4aXQnOiBub2RlID0+IHtcbiAgICAgICAgdXBkYXRlRXhwb3J0VXNhZ2Uobm9kZSk7XG4gICAgICAgIHVwZGF0ZUltcG9ydFVzYWdlKG5vZGUpO1xuICAgICAgICBjaGVja0V4cG9ydFByZXNlbmNlKG5vZGUpO1xuICAgICAgfSxcbiAgICAgICdFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24nOiBub2RlID0+IHtcbiAgICAgICAgY2hlY2tVc2FnZShub2RlLCBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpO1xuICAgICAgfSxcbiAgICAgICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJzogbm9kZSA9PiB7XG4gICAgICAgIG5vZGUuc3BlY2lmaWVycy5mb3JFYWNoKHNwZWNpZmllciA9PiB7XG4gICAgICAgICAgY2hlY2tVc2FnZShub2RlLCBzcGVjaWZpZXIuZXhwb3J0ZWQubmFtZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3JFYWNoRGVjbGFyYXRpb25JZGVudGlmaWVyKG5vZGUuZGVjbGFyYXRpb24sIChuYW1lKSA9PiB7XG4gICAgICAgICAgY2hlY2tVc2FnZShub2RlLCBuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuIl19