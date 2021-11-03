'use strict';
exports.__esModule = true;

const pkgDir = require('pkg-dir');

const fs = require('fs');
const Module = require('module');
const path = require('path');

const hashObject = require('./hash').hashObject;
const ModuleCache = require('./ModuleCache').default;

const CASE_SENSITIVE_FS = !fs.existsSync(path.join(__dirname.toUpperCase(), 'reSOLVE.js'));
exports.CASE_SENSITIVE_FS = CASE_SENSITIVE_FS;

const ERROR_NAME = 'EslintPluginImportResolveError';

const fileExistsCache = new ModuleCache();

// Polyfill Node's `Module.createRequireFromPath` if not present (added in Node v10.12.0)
// Use `Module.createRequire` if available (added in Node v12.2.0)
const createRequire = Module.createRequire || Module.createRequireFromPath || function (filename) {
  const mod = new Module(filename, null);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));

  mod._compile(`module.exports = require;`, filename);

  return mod.exports;
};

function tryRequire(target, sourceFile) {
  let resolved;
  try {
    // Check if the target exists
    if (sourceFile != null) {
      try {
        resolved = createRequire(path.resolve(sourceFile)).resolve(target);
      } catch (e) {
        resolved = require.resolve(target);
      }
    } else {
      resolved = require.resolve(target);
    }
  } catch(e) {
    // If the target does not exist then just return undefined
    return undefined;
  }

  // If the target exists then return the loaded module
  return require(resolved);
}

// http://stackoverflow.com/a/27382838
exports.fileExistsWithCaseSync = function fileExistsWithCaseSync(filepath, cacheSettings) {
  // don't care if the FS is case-sensitive
  if (CASE_SENSITIVE_FS) return true;

  // null means it resolved to a builtin
  if (filepath === null) return true;
  if (filepath.toLowerCase() === process.cwd().toLowerCase()) return true;
  const parsedPath = path.parse(filepath);
  const dir = parsedPath.dir;

  let result = fileExistsCache.get(filepath, cacheSettings);
  if (result != null) return result;

  // base case
  if (dir === '' || parsedPath.root === filepath) {
    result = true;
  } else {
    const filenames = fs.readdirSync(dir);
    if (filenames.indexOf(parsedPath.base) === -1) {
      result = false;
    } else {
      result = fileExistsWithCaseSync(dir, cacheSettings);
    }
  }
  fileExistsCache.set(filepath, result);
  return result;
};

function relative(modulePath, sourceFile, settings) {
  return fullResolve(modulePath, sourceFile, settings).path;
}

function fullResolve(modulePath, sourceFile, settings) {
  // check if this is a bonus core module
  const coreSet = new Set(settings['import/core-modules']);
  if (coreSet.has(modulePath)) return { found: true, path: null };

  const sourceDir = path.dirname(sourceFile);
  const cacheKey = sourceDir + hashObject(settings).digest('hex') + modulePath;

  const cacheSettings = ModuleCache.getSettings(settings);

  const cachedPath = fileExistsCache.get(cacheKey, cacheSettings);
  if (cachedPath !== undefined) return { found: true, path: cachedPath };

  function cache(resolvedPath) {
    fileExistsCache.set(cacheKey, resolvedPath);
  }

  function withResolver(resolver, config) {

    function v1() {
      try {
        const resolved = resolver.resolveImport(modulePath, sourceFile, config);
        if (resolved === undefined) return { found: false };
        return { found: true, path: resolved };
      } catch (err) {
        return { found: false };
      }
    }

    function v2() {
      return resolver.resolve(modulePath, sourceFile, config);
    }

    switch (resolver.interfaceVersion) {
    case 2:
      return v2();

    default:
    case 1:
      return v1();
    }
  }

  const configResolvers = (settings['import/resolver']
    || { 'node': settings['import/resolve'] }); // backward compatibility

  const resolvers = resolverReducer(configResolvers, new Map());

  for (const pair of resolvers) {
    const name = pair[0];
    const config = pair[1];
    const resolver = requireResolver(name, sourceFile);
    const resolved = withResolver(resolver, config);

    if (!resolved.found) continue;

    // else, counts
    cache(resolved.path);
    return resolved;
  }

  // failed
  // cache(undefined)
  return { found: false };
}
exports.relative = relative;

function resolverReducer(resolvers, map) {
  if (Array.isArray(resolvers)) {
    resolvers.forEach(r => resolverReducer(r, map));
    return map;
  }

  if (typeof resolvers === 'string') {
    map.set(resolvers, null);
    return map;
  }

  if (typeof resolvers === 'object') {
    for (const key in resolvers) {
      map.set(key, resolvers[key]);
    }
    return map;
  }

  const err = new Error('invalid resolver config');
  err.name = ERROR_NAME;
  throw err;
}

function getBaseDir(sourceFile) {
  return pkgDir.sync(sourceFile) || process.cwd();
}
function requireResolver(name, sourceFile) {
  // Try to resolve package with conventional name
  const resolver = tryRequire(`eslint-import-resolver-${name}`, sourceFile) ||
    tryRequire(name, sourceFile) ||
    tryRequire(path.resolve(getBaseDir(sourceFile), name));

  if (!resolver) {
    const err = new Error(`unable to load resolver "${name}".`);
    err.name = ERROR_NAME;
    throw err;
  }
  if (!isResolverValid(resolver)) {
    const err = new Error(`${name} with invalid interface loaded as resolver`);
    err.name = ERROR_NAME;
    throw err;
  }

  return resolver;
}

function isResolverValid(resolver) {
  if (resolver.interfaceVersion === 2) {
    return resolver.resolve && typeof resolver.resolve === 'function';
  } else {
    return resolver.resolveImport && typeof resolver.resolveImport === 'function';
  }
}

const erroredContexts = new Set();

/**
 * Given
 * @param  {string} p - module path
 * @param  {object} context - ESLint context
 * @return {string} - the full module filesystem path;
 *                    null if package is core;
 *                    undefined if not found
 */
function resolve(p, context) {
  try {
    return relative( p
      , context.getFilename()
      , context.settings
    );
  } catch (err) {
    if (!erroredContexts.has(context)) {
      // The `err.stack` string starts with `err.name` followed by colon and `err.message`.
      // We're filtering out the default `err.name` because it adds little value to the message.
      let errMessage = err.message;
      if (err.name !== ERROR_NAME && err.stack) {
        errMessage = err.stack.replace(/^Error: /, '');
      }
      context.report({
        message: `Resolve error: ${errMessage}`,
        loc: { line: 1, column: 0 },
      });
      erroredContexts.add(context);
    }
  }
}
resolve.relative = relative;
exports.default = resolve;
