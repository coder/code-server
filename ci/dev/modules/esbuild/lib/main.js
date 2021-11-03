var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// lib/npm/node.ts
__export(exports, {
  analyzeMetafile: () => analyzeMetafile,
  analyzeMetafileSync: () => analyzeMetafileSync,
  build: () => build,
  buildSync: () => buildSync,
  formatMessages: () => formatMessages,
  formatMessagesSync: () => formatMessagesSync,
  initialize: () => initialize,
  serve: () => serve,
  transform: () => transform,
  transformSync: () => transformSync,
  version: () => version
});

// lib/shared/stdio_protocol.ts
function encodePacket(packet) {
  let visit = (value) => {
    if (value === null) {
      bb.write8(0);
    } else if (typeof value === "boolean") {
      bb.write8(1);
      bb.write8(+value);
    } else if (typeof value === "number") {
      bb.write8(2);
      bb.write32(value | 0);
    } else if (typeof value === "string") {
      bb.write8(3);
      bb.write(encodeUTF8(value));
    } else if (value instanceof Uint8Array) {
      bb.write8(4);
      bb.write(value);
    } else if (value instanceof Array) {
      bb.write8(5);
      bb.write32(value.length);
      for (let item of value) {
        visit(item);
      }
    } else {
      let keys = Object.keys(value);
      bb.write8(6);
      bb.write32(keys.length);
      for (let key of keys) {
        bb.write(encodeUTF8(key));
        visit(value[key]);
      }
    }
  };
  let bb = new ByteBuffer();
  bb.write32(0);
  bb.write32(packet.id << 1 | +!packet.isRequest);
  visit(packet.value);
  writeUInt32LE(bb.buf, bb.len - 4, 0);
  return bb.buf.subarray(0, bb.len);
}
function decodePacket(bytes) {
  let visit = () => {
    switch (bb.read8()) {
      case 0:
        return null;
      case 1:
        return !!bb.read8();
      case 2:
        return bb.read32();
      case 3:
        return decodeUTF8(bb.read());
      case 4:
        return bb.read();
      case 5: {
        let count = bb.read32();
        let value2 = [];
        for (let i = 0; i < count; i++) {
          value2.push(visit());
        }
        return value2;
      }
      case 6: {
        let count = bb.read32();
        let value2 = {};
        for (let i = 0; i < count; i++) {
          value2[decodeUTF8(bb.read())] = visit();
        }
        return value2;
      }
      default:
        throw new Error("Invalid packet");
    }
  };
  let bb = new ByteBuffer(bytes);
  let id = bb.read32();
  let isRequest = (id & 1) === 0;
  id >>>= 1;
  let value = visit();
  if (bb.ptr !== bytes.length) {
    throw new Error("Invalid packet");
  }
  return { id, isRequest, value };
}
var ByteBuffer = class {
  constructor(buf = new Uint8Array(1024)) {
    this.buf = buf;
    this.len = 0;
    this.ptr = 0;
  }
  _write(delta) {
    if (this.len + delta > this.buf.length) {
      let clone = new Uint8Array((this.len + delta) * 2);
      clone.set(this.buf);
      this.buf = clone;
    }
    this.len += delta;
    return this.len - delta;
  }
  write8(value) {
    let offset = this._write(1);
    this.buf[offset] = value;
  }
  write32(value) {
    let offset = this._write(4);
    writeUInt32LE(this.buf, value, offset);
  }
  write(bytes) {
    let offset = this._write(4 + bytes.length);
    writeUInt32LE(this.buf, bytes.length, offset);
    this.buf.set(bytes, offset + 4);
  }
  _read(delta) {
    if (this.ptr + delta > this.buf.length) {
      throw new Error("Invalid packet");
    }
    this.ptr += delta;
    return this.ptr - delta;
  }
  read8() {
    return this.buf[this._read(1)];
  }
  read32() {
    return readUInt32LE(this.buf, this._read(4));
  }
  read() {
    let length = this.read32();
    let bytes = new Uint8Array(length);
    let ptr = this._read(bytes.length);
    bytes.set(this.buf.subarray(ptr, ptr + length));
    return bytes;
  }
};
var encodeUTF8;
var decodeUTF8;
if (typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined") {
  let encoder = new TextEncoder();
  let decoder = new TextDecoder();
  encodeUTF8 = (text) => encoder.encode(text);
  decodeUTF8 = (bytes) => decoder.decode(bytes);
} else if (typeof Buffer !== "undefined") {
  encodeUTF8 = (text) => {
    let buffer = Buffer.from(text);
    if (!(buffer instanceof Uint8Array)) {
      buffer = new Uint8Array(buffer);
    }
    return buffer;
  };
  decodeUTF8 = (bytes) => {
    let { buffer, byteOffset, byteLength } = bytes;
    return Buffer.from(buffer, byteOffset, byteLength).toString();
  };
} else {
  throw new Error("No UTF-8 codec found");
}
function readUInt32LE(buffer, offset) {
  return buffer[offset++] | buffer[offset++] << 8 | buffer[offset++] << 16 | buffer[offset++] << 24;
}
function writeUInt32LE(buffer, value, offset) {
  buffer[offset++] = value;
  buffer[offset++] = value >> 8;
  buffer[offset++] = value >> 16;
  buffer[offset++] = value >> 24;
}

// lib/shared/common.ts
function validateTarget(target) {
  target += "";
  if (target.indexOf(",") >= 0)
    throw new Error(`Invalid target: ${target}`);
  return target;
}
var canBeAnything = () => null;
var mustBeBoolean = (value) => typeof value === "boolean" ? null : "a boolean";
var mustBeBooleanOrObject = (value) => typeof value === "boolean" || typeof value === "object" && !Array.isArray(value) ? null : "a boolean or an object";
var mustBeString = (value) => typeof value === "string" ? null : "a string";
var mustBeRegExp = (value) => value instanceof RegExp ? null : "a RegExp object";
var mustBeInteger = (value) => typeof value === "number" && value === (value | 0) ? null : "an integer";
var mustBeFunction = (value) => typeof value === "function" ? null : "a function";
var mustBeArray = (value) => Array.isArray(value) ? null : "an array";
var mustBeObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value) ? null : "an object";
var mustBeArrayOrRecord = (value) => typeof value === "object" && value !== null ? null : "an array or an object";
var mustBeObjectOrNull = (value) => typeof value === "object" && !Array.isArray(value) ? null : "an object or null";
var mustBeStringOrBoolean = (value) => typeof value === "string" || typeof value === "boolean" ? null : "a string or a boolean";
var mustBeStringOrObject = (value) => typeof value === "string" || typeof value === "object" && value !== null && !Array.isArray(value) ? null : "a string or an object";
var mustBeStringOrArray = (value) => typeof value === "string" || Array.isArray(value) ? null : "a string or an array";
var mustBeStringOrUint8Array = (value) => typeof value === "string" || value instanceof Uint8Array ? null : "a string or a Uint8Array";
function getFlag(object, keys, key, mustBeFn) {
  let value = object[key];
  keys[key + ""] = true;
  if (value === void 0)
    return void 0;
  let mustBe = mustBeFn(value);
  if (mustBe !== null)
    throw new Error(`"${key}" must be ${mustBe}`);
  return value;
}
function checkForInvalidFlags(object, keys, where) {
  for (let key in object) {
    if (!(key in keys)) {
      throw new Error(`Invalid option ${where}: "${key}"`);
    }
  }
}
function validateInitializeOptions(options) {
  let keys = Object.create(null);
  let wasmURL = getFlag(options, keys, "wasmURL", mustBeString);
  let worker = getFlag(options, keys, "worker", mustBeBoolean);
  checkForInvalidFlags(options, keys, "in startService() call");
  return {
    wasmURL,
    worker
  };
}
function pushLogFlags(flags, options, keys, isTTY2, logLevelDefault) {
  let color = getFlag(options, keys, "color", mustBeBoolean);
  let logLevel = getFlag(options, keys, "logLevel", mustBeString);
  let logLimit = getFlag(options, keys, "logLimit", mustBeInteger);
  if (color !== void 0)
    flags.push(`--color=${color}`);
  else if (isTTY2)
    flags.push(`--color=true`);
  flags.push(`--log-level=${logLevel || logLevelDefault}`);
  flags.push(`--log-limit=${logLimit || 0}`);
}
function pushCommonFlags(flags, options, keys) {
  let legalComments = getFlag(options, keys, "legalComments", mustBeString);
  let sourceRoot = getFlag(options, keys, "sourceRoot", mustBeString);
  let sourcesContent = getFlag(options, keys, "sourcesContent", mustBeBoolean);
  let target = getFlag(options, keys, "target", mustBeStringOrArray);
  let format = getFlag(options, keys, "format", mustBeString);
  let globalName = getFlag(options, keys, "globalName", mustBeString);
  let minify = getFlag(options, keys, "minify", mustBeBoolean);
  let minifySyntax = getFlag(options, keys, "minifySyntax", mustBeBoolean);
  let minifyWhitespace = getFlag(options, keys, "minifyWhitespace", mustBeBoolean);
  let minifyIdentifiers = getFlag(options, keys, "minifyIdentifiers", mustBeBoolean);
  let charset = getFlag(options, keys, "charset", mustBeString);
  let treeShaking = getFlag(options, keys, "treeShaking", mustBeBoolean);
  let ignoreAnnotations = getFlag(options, keys, "ignoreAnnotations", mustBeBoolean);
  let jsx = getFlag(options, keys, "jsx", mustBeString);
  let jsxFactory = getFlag(options, keys, "jsxFactory", mustBeString);
  let jsxFragment = getFlag(options, keys, "jsxFragment", mustBeString);
  let define = getFlag(options, keys, "define", mustBeObject);
  let pure = getFlag(options, keys, "pure", mustBeArray);
  let keepNames = getFlag(options, keys, "keepNames", mustBeBoolean);
  if (legalComments)
    flags.push(`--legal-comments=${legalComments}`);
  if (sourceRoot !== void 0)
    flags.push(`--source-root=${sourceRoot}`);
  if (sourcesContent !== void 0)
    flags.push(`--sources-content=${sourcesContent}`);
  if (target) {
    if (Array.isArray(target))
      flags.push(`--target=${Array.from(target).map(validateTarget).join(",")}`);
    else
      flags.push(`--target=${validateTarget(target)}`);
  }
  if (format)
    flags.push(`--format=${format}`);
  if (globalName)
    flags.push(`--global-name=${globalName}`);
  if (minify)
    flags.push("--minify");
  if (minifySyntax)
    flags.push("--minify-syntax");
  if (minifyWhitespace)
    flags.push("--minify-whitespace");
  if (minifyIdentifiers)
    flags.push("--minify-identifiers");
  if (charset)
    flags.push(`--charset=${charset}`);
  if (treeShaking !== void 0)
    flags.push(`--tree-shaking=${treeShaking}`);
  if (ignoreAnnotations)
    flags.push(`--ignore-annotations`);
  if (jsx)
    flags.push(`--jsx=${jsx}`);
  if (jsxFactory)
    flags.push(`--jsx-factory=${jsxFactory}`);
  if (jsxFragment)
    flags.push(`--jsx-fragment=${jsxFragment}`);
  if (define) {
    for (let key in define) {
      if (key.indexOf("=") >= 0)
        throw new Error(`Invalid define: ${key}`);
      flags.push(`--define:${key}=${define[key]}`);
    }
  }
  if (pure)
    for (let fn of pure)
      flags.push(`--pure:${fn}`);
  if (keepNames)
    flags.push(`--keep-names`);
}
function flagsForBuildOptions(callName, options, isTTY2, logLevelDefault, writeDefault) {
  var _a2;
  let flags = [];
  let entries = [];
  let keys = Object.create(null);
  let stdinContents = null;
  let stdinResolveDir = null;
  let watchMode = null;
  pushLogFlags(flags, options, keys, isTTY2, logLevelDefault);
  pushCommonFlags(flags, options, keys);
  let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
  let bundle = getFlag(options, keys, "bundle", mustBeBoolean);
  let watch = getFlag(options, keys, "watch", mustBeBooleanOrObject);
  let splitting = getFlag(options, keys, "splitting", mustBeBoolean);
  let preserveSymlinks = getFlag(options, keys, "preserveSymlinks", mustBeBoolean);
  let metafile = getFlag(options, keys, "metafile", mustBeBoolean);
  let outfile = getFlag(options, keys, "outfile", mustBeString);
  let outdir = getFlag(options, keys, "outdir", mustBeString);
  let outbase = getFlag(options, keys, "outbase", mustBeString);
  let platform = getFlag(options, keys, "platform", mustBeString);
  let tsconfig = getFlag(options, keys, "tsconfig", mustBeString);
  let resolveExtensions = getFlag(options, keys, "resolveExtensions", mustBeArray);
  let nodePathsInput = getFlag(options, keys, "nodePaths", mustBeArray);
  let mainFields = getFlag(options, keys, "mainFields", mustBeArray);
  let conditions = getFlag(options, keys, "conditions", mustBeArray);
  let external = getFlag(options, keys, "external", mustBeArray);
  let loader = getFlag(options, keys, "loader", mustBeObject);
  let outExtension = getFlag(options, keys, "outExtension", mustBeObject);
  let publicPath = getFlag(options, keys, "publicPath", mustBeString);
  let entryNames = getFlag(options, keys, "entryNames", mustBeString);
  let chunkNames = getFlag(options, keys, "chunkNames", mustBeString);
  let assetNames = getFlag(options, keys, "assetNames", mustBeString);
  let inject = getFlag(options, keys, "inject", mustBeArray);
  let banner = getFlag(options, keys, "banner", mustBeObject);
  let footer = getFlag(options, keys, "footer", mustBeObject);
  let entryPoints = getFlag(options, keys, "entryPoints", mustBeArrayOrRecord);
  let absWorkingDir = getFlag(options, keys, "absWorkingDir", mustBeString);
  let stdin = getFlag(options, keys, "stdin", mustBeObject);
  let write = (_a2 = getFlag(options, keys, "write", mustBeBoolean)) != null ? _a2 : writeDefault;
  let allowOverwrite = getFlag(options, keys, "allowOverwrite", mustBeBoolean);
  let incremental = getFlag(options, keys, "incremental", mustBeBoolean) === true;
  keys.plugins = true;
  checkForInvalidFlags(options, keys, `in ${callName}() call`);
  if (sourcemap)
    flags.push(`--sourcemap${sourcemap === true ? "" : `=${sourcemap}`}`);
  if (bundle)
    flags.push("--bundle");
  if (allowOverwrite)
    flags.push("--allow-overwrite");
  if (watch) {
    flags.push("--watch");
    if (typeof watch === "boolean") {
      watchMode = {};
    } else {
      let watchKeys = Object.create(null);
      let onRebuild = getFlag(watch, watchKeys, "onRebuild", mustBeFunction);
      checkForInvalidFlags(watch, watchKeys, `on "watch" in ${callName}() call`);
      watchMode = { onRebuild };
    }
  }
  if (splitting)
    flags.push("--splitting");
  if (preserveSymlinks)
    flags.push("--preserve-symlinks");
  if (metafile)
    flags.push(`--metafile`);
  if (outfile)
    flags.push(`--outfile=${outfile}`);
  if (outdir)
    flags.push(`--outdir=${outdir}`);
  if (outbase)
    flags.push(`--outbase=${outbase}`);
  if (platform)
    flags.push(`--platform=${platform}`);
  if (tsconfig)
    flags.push(`--tsconfig=${tsconfig}`);
  if (resolveExtensions) {
    let values = [];
    for (let value of resolveExtensions) {
      value += "";
      if (value.indexOf(",") >= 0)
        throw new Error(`Invalid resolve extension: ${value}`);
      values.push(value);
    }
    flags.push(`--resolve-extensions=${values.join(",")}`);
  }
  if (publicPath)
    flags.push(`--public-path=${publicPath}`);
  if (entryNames)
    flags.push(`--entry-names=${entryNames}`);
  if (chunkNames)
    flags.push(`--chunk-names=${chunkNames}`);
  if (assetNames)
    flags.push(`--asset-names=${assetNames}`);
  if (mainFields) {
    let values = [];
    for (let value of mainFields) {
      value += "";
      if (value.indexOf(",") >= 0)
        throw new Error(`Invalid main field: ${value}`);
      values.push(value);
    }
    flags.push(`--main-fields=${values.join(",")}`);
  }
  if (conditions) {
    let values = [];
    for (let value of conditions) {
      value += "";
      if (value.indexOf(",") >= 0)
        throw new Error(`Invalid condition: ${value}`);
      values.push(value);
    }
    flags.push(`--conditions=${values.join(",")}`);
  }
  if (external)
    for (let name of external)
      flags.push(`--external:${name}`);
  if (banner) {
    for (let type in banner) {
      if (type.indexOf("=") >= 0)
        throw new Error(`Invalid banner file type: ${type}`);
      flags.push(`--banner:${type}=${banner[type]}`);
    }
  }
  if (footer) {
    for (let type in footer) {
      if (type.indexOf("=") >= 0)
        throw new Error(`Invalid footer file type: ${type}`);
      flags.push(`--footer:${type}=${footer[type]}`);
    }
  }
  if (inject)
    for (let path3 of inject)
      flags.push(`--inject:${path3}`);
  if (loader) {
    for (let ext in loader) {
      if (ext.indexOf("=") >= 0)
        throw new Error(`Invalid loader extension: ${ext}`);
      flags.push(`--loader:${ext}=${loader[ext]}`);
    }
  }
  if (outExtension) {
    for (let ext in outExtension) {
      if (ext.indexOf("=") >= 0)
        throw new Error(`Invalid out extension: ${ext}`);
      flags.push(`--out-extension:${ext}=${outExtension[ext]}`);
    }
  }
  if (entryPoints) {
    if (Array.isArray(entryPoints)) {
      for (let entryPoint of entryPoints) {
        entries.push(["", entryPoint + ""]);
      }
    } else {
      for (let [key, value] of Object.entries(entryPoints)) {
        entries.push([key + "", value + ""]);
      }
    }
  }
  if (stdin) {
    let stdinKeys = Object.create(null);
    let contents = getFlag(stdin, stdinKeys, "contents", mustBeString);
    let resolveDir = getFlag(stdin, stdinKeys, "resolveDir", mustBeString);
    let sourcefile = getFlag(stdin, stdinKeys, "sourcefile", mustBeString);
    let loader2 = getFlag(stdin, stdinKeys, "loader", mustBeString);
    checkForInvalidFlags(stdin, stdinKeys, 'in "stdin" object');
    if (sourcefile)
      flags.push(`--sourcefile=${sourcefile}`);
    if (loader2)
      flags.push(`--loader=${loader2}`);
    if (resolveDir)
      stdinResolveDir = resolveDir + "";
    stdinContents = contents ? contents + "" : "";
  }
  let nodePaths = [];
  if (nodePathsInput) {
    for (let value of nodePathsInput) {
      value += "";
      nodePaths.push(value);
    }
  }
  return {
    entries,
    flags,
    write,
    stdinContents,
    stdinResolveDir,
    absWorkingDir,
    incremental,
    nodePaths,
    watch: watchMode
  };
}
function flagsForTransformOptions(callName, options, isTTY2, logLevelDefault) {
  let flags = [];
  let keys = Object.create(null);
  pushLogFlags(flags, options, keys, isTTY2, logLevelDefault);
  pushCommonFlags(flags, options, keys);
  let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
  let tsconfigRaw = getFlag(options, keys, "tsconfigRaw", mustBeStringOrObject);
  let sourcefile = getFlag(options, keys, "sourcefile", mustBeString);
  let loader = getFlag(options, keys, "loader", mustBeString);
  let banner = getFlag(options, keys, "banner", mustBeString);
  let footer = getFlag(options, keys, "footer", mustBeString);
  checkForInvalidFlags(options, keys, `in ${callName}() call`);
  if (sourcemap)
    flags.push(`--sourcemap=${sourcemap === true ? "external" : sourcemap}`);
  if (tsconfigRaw)
    flags.push(`--tsconfig-raw=${typeof tsconfigRaw === "string" ? tsconfigRaw : JSON.stringify(tsconfigRaw)}`);
  if (sourcefile)
    flags.push(`--sourcefile=${sourcefile}`);
  if (loader)
    flags.push(`--loader=${loader}`);
  if (banner)
    flags.push(`--banner=${banner}`);
  if (footer)
    flags.push(`--footer=${footer}`);
  return flags;
}
function createChannel(streamIn) {
  let responseCallbacks = new Map();
  let pluginCallbacks = new Map();
  let watchCallbacks = new Map();
  let serveCallbacks = new Map();
  let nextServeID = 0;
  let isClosed = false;
  let nextRequestID = 0;
  let nextBuildKey = 0;
  let stdout = new Uint8Array(16 * 1024);
  let stdoutUsed = 0;
  let readFromStdout = (chunk) => {
    let limit = stdoutUsed + chunk.length;
    if (limit > stdout.length) {
      let swap = new Uint8Array(limit * 2);
      swap.set(stdout);
      stdout = swap;
    }
    stdout.set(chunk, stdoutUsed);
    stdoutUsed += chunk.length;
    let offset = 0;
    while (offset + 4 <= stdoutUsed) {
      let length = readUInt32LE(stdout, offset);
      if (offset + 4 + length > stdoutUsed) {
        break;
      }
      offset += 4;
      handleIncomingPacket(stdout.subarray(offset, offset + length));
      offset += length;
    }
    if (offset > 0) {
      stdout.copyWithin(0, offset, stdoutUsed);
      stdoutUsed -= offset;
    }
  };
  let afterClose = () => {
    isClosed = true;
    for (let callback of responseCallbacks.values()) {
      callback("The service was stopped", null);
    }
    responseCallbacks.clear();
    for (let callbacks of serveCallbacks.values()) {
      callbacks.onWait("The service was stopped");
    }
    serveCallbacks.clear();
    for (let callback of watchCallbacks.values()) {
      try {
        callback(new Error("The service was stopped"), null);
      } catch (e) {
        console.error(e);
      }
    }
    watchCallbacks.clear();
  };
  let sendRequest = (refs, value, callback) => {
    if (isClosed)
      return callback("The service is no longer running", null);
    let id = nextRequestID++;
    responseCallbacks.set(id, (error, response) => {
      try {
        callback(error, response);
      } finally {
        if (refs)
          refs.unref();
      }
    });
    if (refs)
      refs.ref();
    streamIn.writeToStdin(encodePacket({ id, isRequest: true, value }));
  };
  let sendResponse = (id, value) => {
    if (isClosed)
      throw new Error("The service is no longer running");
    streamIn.writeToStdin(encodePacket({ id, isRequest: false, value }));
  };
  let handleRequest = async (id, request) => {
    try {
      switch (request.command) {
        case "ping": {
          sendResponse(id, {});
          break;
        }
        case "start": {
          let callback = pluginCallbacks.get(request.key);
          if (!callback)
            sendResponse(id, {});
          else
            sendResponse(id, await callback(request));
          break;
        }
        case "resolve": {
          let callback = pluginCallbacks.get(request.key);
          if (!callback)
            sendResponse(id, {});
          else
            sendResponse(id, await callback(request));
          break;
        }
        case "load": {
          let callback = pluginCallbacks.get(request.key);
          if (!callback)
            sendResponse(id, {});
          else
            sendResponse(id, await callback(request));
          break;
        }
        case "serve-request": {
          let callbacks = serveCallbacks.get(request.serveID);
          if (callbacks && callbacks.onRequest)
            callbacks.onRequest(request.args);
          sendResponse(id, {});
          break;
        }
        case "serve-wait": {
          let callbacks = serveCallbacks.get(request.serveID);
          if (callbacks)
            callbacks.onWait(request.error);
          sendResponse(id, {});
          break;
        }
        case "watch-rebuild": {
          let callback = watchCallbacks.get(request.watchID);
          try {
            if (callback)
              callback(null, request.args);
          } catch (err) {
            console.error(err);
          }
          sendResponse(id, {});
          break;
        }
        default:
          throw new Error(`Invalid command: ` + request.command);
      }
    } catch (e) {
      sendResponse(id, { errors: [extractErrorMessageV8(e, streamIn, null, void 0, "")] });
    }
  };
  let isFirstPacket = true;
  let handleIncomingPacket = (bytes) => {
    if (isFirstPacket) {
      isFirstPacket = false;
      let binaryVersion = String.fromCharCode(...bytes);
      if (binaryVersion !== "0.13.9") {
        throw new Error(`Cannot start service: Host version "${"0.13.9"}" does not match binary version ${JSON.stringify(binaryVersion)}`);
      }
      return;
    }
    let packet = decodePacket(bytes);
    if (packet.isRequest) {
      handleRequest(packet.id, packet.value);
    } else {
      let callback = responseCallbacks.get(packet.id);
      responseCallbacks.delete(packet.id);
      if (packet.value.error)
        callback(packet.value.error, {});
      else
        callback(null, packet.value);
    }
  };
  let handlePlugins = async (initialOptions, plugins, buildKey, stash) => {
    let onStartCallbacks = [];
    let onEndCallbacks = [];
    let onResolveCallbacks = {};
    let onLoadCallbacks = {};
    let nextCallbackID = 0;
    let i = 0;
    let requestPlugins = [];
    plugins = [...plugins];
    for (let item of plugins) {
      let keys = {};
      if (typeof item !== "object")
        throw new Error(`Plugin at index ${i} must be an object`);
      let name = getFlag(item, keys, "name", mustBeString);
      if (typeof name !== "string" || name === "")
        throw new Error(`Plugin at index ${i} is missing a name`);
      try {
        let setup = getFlag(item, keys, "setup", mustBeFunction);
        if (typeof setup !== "function")
          throw new Error(`Plugin is missing a setup function`);
        checkForInvalidFlags(item, keys, `on plugin ${JSON.stringify(name)}`);
        let plugin = {
          name,
          onResolve: [],
          onLoad: []
        };
        i++;
        let promise = setup({
          initialOptions,
          onStart(callback2) {
            let registeredText = `This error came from the "onStart" callback registered here`;
            let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onStart");
            onStartCallbacks.push({ name, callback: callback2, note: registeredNote });
          },
          onEnd(callback2) {
            let registeredText = `This error came from the "onEnd" callback registered here`;
            let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onEnd");
            onEndCallbacks.push({ name, callback: callback2, note: registeredNote });
          },
          onResolve(options, callback2) {
            let registeredText = `This error came from the "onResolve" callback registered here`;
            let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onResolve");
            let keys2 = {};
            let filter = getFlag(options, keys2, "filter", mustBeRegExp);
            let namespace = getFlag(options, keys2, "namespace", mustBeString);
            checkForInvalidFlags(options, keys2, `in onResolve() call for plugin ${JSON.stringify(name)}`);
            if (filter == null)
              throw new Error(`onResolve() call is missing a filter`);
            let id = nextCallbackID++;
            onResolveCallbacks[id] = { name, callback: callback2, note: registeredNote };
            plugin.onResolve.push({ id, filter: filter.source, namespace: namespace || "" });
          },
          onLoad(options, callback2) {
            let registeredText = `This error came from the "onLoad" callback registered here`;
            let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onLoad");
            let keys2 = {};
            let filter = getFlag(options, keys2, "filter", mustBeRegExp);
            let namespace = getFlag(options, keys2, "namespace", mustBeString);
            checkForInvalidFlags(options, keys2, `in onLoad() call for plugin ${JSON.stringify(name)}`);
            if (filter == null)
              throw new Error(`onLoad() call is missing a filter`);
            let id = nextCallbackID++;
            onLoadCallbacks[id] = { name, callback: callback2, note: registeredNote };
            plugin.onLoad.push({ id, filter: filter.source, namespace: namespace || "" });
          }
        });
        if (promise)
          await promise;
        requestPlugins.push(plugin);
      } catch (e) {
        return { ok: false, error: e, pluginName: name };
      }
    }
    const callback = async (request) => {
      switch (request.command) {
        case "start": {
          let response = { errors: [], warnings: [] };
          await Promise.all(onStartCallbacks.map(async ({ name, callback: callback2, note }) => {
            try {
              let result = await callback2();
              if (result != null) {
                if (typeof result !== "object")
                  throw new Error(`Expected onStart() callback in plugin ${JSON.stringify(name)} to return an object`);
                let keys = {};
                let errors = getFlag(result, keys, "errors", mustBeArray);
                let warnings = getFlag(result, keys, "warnings", mustBeArray);
                checkForInvalidFlags(result, keys, `from onStart() callback in plugin ${JSON.stringify(name)}`);
                if (errors != null)
                  response.errors.push(...sanitizeMessages(errors, "errors", stash, name));
                if (warnings != null)
                  response.warnings.push(...sanitizeMessages(warnings, "warnings", stash, name));
              }
            } catch (e) {
              response.errors.push(extractErrorMessageV8(e, streamIn, stash, note && note(), name));
            }
          }));
          return response;
        }
        case "resolve": {
          let response = {}, name = "", callback2, note;
          for (let id of request.ids) {
            try {
              ({ name, callback: callback2, note } = onResolveCallbacks[id]);
              let result = await callback2({
                path: request.path,
                importer: request.importer,
                namespace: request.namespace,
                resolveDir: request.resolveDir,
                kind: request.kind,
                pluginData: stash.load(request.pluginData)
              });
              if (result != null) {
                if (typeof result !== "object")
                  throw new Error(`Expected onResolve() callback in plugin ${JSON.stringify(name)} to return an object`);
                let keys = {};
                let pluginName = getFlag(result, keys, "pluginName", mustBeString);
                let path3 = getFlag(result, keys, "path", mustBeString);
                let namespace = getFlag(result, keys, "namespace", mustBeString);
                let external = getFlag(result, keys, "external", mustBeBoolean);
                let sideEffects = getFlag(result, keys, "sideEffects", mustBeBoolean);
                let pluginData = getFlag(result, keys, "pluginData", canBeAnything);
                let errors = getFlag(result, keys, "errors", mustBeArray);
                let warnings = getFlag(result, keys, "warnings", mustBeArray);
                let watchFiles = getFlag(result, keys, "watchFiles", mustBeArray);
                let watchDirs = getFlag(result, keys, "watchDirs", mustBeArray);
                checkForInvalidFlags(result, keys, `from onResolve() callback in plugin ${JSON.stringify(name)}`);
                response.id = id;
                if (pluginName != null)
                  response.pluginName = pluginName;
                if (path3 != null)
                  response.path = path3;
                if (namespace != null)
                  response.namespace = namespace;
                if (external != null)
                  response.external = external;
                if (sideEffects != null)
                  response.sideEffects = sideEffects;
                if (pluginData != null)
                  response.pluginData = stash.store(pluginData);
                if (errors != null)
                  response.errors = sanitizeMessages(errors, "errors", stash, name);
                if (warnings != null)
                  response.warnings = sanitizeMessages(warnings, "warnings", stash, name);
                if (watchFiles != null)
                  response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
                if (watchDirs != null)
                  response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
                break;
              }
            } catch (e) {
              return { id, errors: [extractErrorMessageV8(e, streamIn, stash, note && note(), name)] };
            }
          }
          return response;
        }
        case "load": {
          let response = {}, name = "", callback2, note;
          for (let id of request.ids) {
            try {
              ({ name, callback: callback2, note } = onLoadCallbacks[id]);
              let result = await callback2({
                path: request.path,
                namespace: request.namespace,
                pluginData: stash.load(request.pluginData)
              });
              if (result != null) {
                if (typeof result !== "object")
                  throw new Error(`Expected onLoad() callback in plugin ${JSON.stringify(name)} to return an object`);
                let keys = {};
                let pluginName = getFlag(result, keys, "pluginName", mustBeString);
                let contents = getFlag(result, keys, "contents", mustBeStringOrUint8Array);
                let resolveDir = getFlag(result, keys, "resolveDir", mustBeString);
                let pluginData = getFlag(result, keys, "pluginData", canBeAnything);
                let loader = getFlag(result, keys, "loader", mustBeString);
                let errors = getFlag(result, keys, "errors", mustBeArray);
                let warnings = getFlag(result, keys, "warnings", mustBeArray);
                let watchFiles = getFlag(result, keys, "watchFiles", mustBeArray);
                let watchDirs = getFlag(result, keys, "watchDirs", mustBeArray);
                checkForInvalidFlags(result, keys, `from onLoad() callback in plugin ${JSON.stringify(name)}`);
                response.id = id;
                if (pluginName != null)
                  response.pluginName = pluginName;
                if (contents instanceof Uint8Array)
                  response.contents = contents;
                else if (contents != null)
                  response.contents = encodeUTF8(contents);
                if (resolveDir != null)
                  response.resolveDir = resolveDir;
                if (pluginData != null)
                  response.pluginData = stash.store(pluginData);
                if (loader != null)
                  response.loader = loader;
                if (errors != null)
                  response.errors = sanitizeMessages(errors, "errors", stash, name);
                if (warnings != null)
                  response.warnings = sanitizeMessages(warnings, "warnings", stash, name);
                if (watchFiles != null)
                  response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
                if (watchDirs != null)
                  response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
                break;
              }
            } catch (e) {
              return { id, errors: [extractErrorMessageV8(e, streamIn, stash, note && note(), name)] };
            }
          }
          return response;
        }
        default:
          throw new Error(`Invalid command: ` + request.command);
      }
    };
    let runOnEndCallbacks = (result, logPluginError, done) => done();
    if (onEndCallbacks.length > 0) {
      runOnEndCallbacks = (result, logPluginError, done) => {
        (async () => {
          for (const { name, callback: callback2, note } of onEndCallbacks) {
            try {
              await callback2(result);
            } catch (e) {
              result.errors.push(await new Promise((resolve) => logPluginError(e, name, note && note(), resolve)));
            }
          }
        })().then(done);
      };
    }
    let refCount = 0;
    return {
      ok: true,
      requestPlugins,
      runOnEndCallbacks,
      pluginRefs: {
        ref() {
          if (++refCount === 1)
            pluginCallbacks.set(buildKey, callback);
        },
        unref() {
          if (--refCount === 0)
            pluginCallbacks.delete(buildKey);
        }
      }
    };
  };
  let buildServeData = (refs, options, request) => {
    let keys = {};
    let port = getFlag(options, keys, "port", mustBeInteger);
    let host = getFlag(options, keys, "host", mustBeString);
    let servedir = getFlag(options, keys, "servedir", mustBeString);
    let onRequest = getFlag(options, keys, "onRequest", mustBeFunction);
    let serveID = nextServeID++;
    let onWait;
    let wait = new Promise((resolve, reject) => {
      onWait = (error) => {
        serveCallbacks.delete(serveID);
        if (error !== null)
          reject(new Error(error));
        else
          resolve();
      };
    });
    request.serve = { serveID };
    checkForInvalidFlags(options, keys, `in serve() call`);
    if (port !== void 0)
      request.serve.port = port;
    if (host !== void 0)
      request.serve.host = host;
    if (servedir !== void 0)
      request.serve.servedir = servedir;
    serveCallbacks.set(serveID, {
      onRequest,
      onWait
    });
    return {
      wait,
      stop() {
        sendRequest(refs, { command: "serve-stop", serveID }, () => {
        });
      }
    };
  };
  const buildLogLevelDefault = "warning";
  const transformLogLevelDefault = "silent";
  let buildOrServe = (args) => {
    let key = nextBuildKey++;
    const details = createObjectStash();
    let plugins;
    let { refs, options, isTTY: isTTY2, callback } = args;
    if (typeof options === "object") {
      let value = options.plugins;
      if (value !== void 0) {
        if (!Array.isArray(value))
          throw new Error(`"plugins" must be an array`);
        plugins = value;
      }
    }
    let logPluginError = (e, pluginName, note, done) => {
      let flags = [];
      try {
        pushLogFlags(flags, options, {}, isTTY2, buildLogLevelDefault);
      } catch (e2) {
      }
      const message = extractErrorMessageV8(e, streamIn, details, note, pluginName);
      sendRequest(refs, { command: "error", flags, error: message }, () => {
        message.detail = details.load(message.detail);
        done(message);
      });
    };
    let handleError = (e, pluginName) => {
      logPluginError(e, pluginName, void 0, (error) => {
        callback(failureErrorWithLog("Build failed", [error], []), null);
      });
    };
    if (plugins && plugins.length > 0) {
      if (streamIn.isSync)
        return handleError(new Error("Cannot use plugins in synchronous API calls"), "");
      handlePlugins(options, plugins, key, details).then((result) => {
        if (!result.ok) {
          handleError(result.error, result.pluginName);
        } else {
          try {
            buildOrServeContinue(__spreadProps(__spreadValues({}, args), {
              key,
              details,
              logPluginError,
              requestPlugins: result.requestPlugins,
              runOnEndCallbacks: result.runOnEndCallbacks,
              pluginRefs: result.pluginRefs
            }));
          } catch (e) {
            handleError(e, "");
          }
        }
      }, (e) => handleError(e, ""));
    } else {
      try {
        buildOrServeContinue(__spreadProps(__spreadValues({}, args), {
          key,
          details,
          logPluginError,
          requestPlugins: null,
          runOnEndCallbacks: (result, logPluginError2, done) => done(),
          pluginRefs: null
        }));
      } catch (e) {
        handleError(e, "");
      }
    }
  };
  let buildOrServeContinue = ({
    callName,
    refs: callerRefs,
    serveOptions,
    options,
    isTTY: isTTY2,
    defaultWD: defaultWD2,
    callback,
    key,
    details,
    logPluginError,
    requestPlugins,
    runOnEndCallbacks,
    pluginRefs
  }) => {
    const refs = {
      ref() {
        if (pluginRefs)
          pluginRefs.ref();
        if (callerRefs)
          callerRefs.ref();
      },
      unref() {
        if (pluginRefs)
          pluginRefs.unref();
        if (callerRefs)
          callerRefs.unref();
      }
    };
    let writeDefault = !streamIn.isBrowser;
    let {
      entries,
      flags,
      write,
      stdinContents,
      stdinResolveDir,
      absWorkingDir,
      incremental,
      nodePaths,
      watch
    } = flagsForBuildOptions(callName, options, isTTY2, buildLogLevelDefault, writeDefault);
    let request = {
      command: "build",
      key,
      entries,
      flags,
      write,
      stdinContents,
      stdinResolveDir,
      absWorkingDir: absWorkingDir || defaultWD2,
      incremental,
      nodePaths
    };
    if (requestPlugins)
      request.plugins = requestPlugins;
    let serve2 = serveOptions && buildServeData(refs, serveOptions, request);
    let rebuild;
    let stop;
    let copyResponseToResult = (response, result) => {
      if (response.outputFiles)
        result.outputFiles = response.outputFiles.map(convertOutputFiles);
      if (response.metafile)
        result.metafile = JSON.parse(response.metafile);
      if (response.writeToStdout !== void 0)
        console.log(decodeUTF8(response.writeToStdout).replace(/\n$/, ""));
    };
    let buildResponseToResult = (response, callback2) => {
      let result = {
        errors: replaceDetailsInMessages(response.errors, details),
        warnings: replaceDetailsInMessages(response.warnings, details)
      };
      copyResponseToResult(response, result);
      runOnEndCallbacks(result, logPluginError, () => {
        if (result.errors.length > 0) {
          return callback2(failureErrorWithLog("Build failed", result.errors, result.warnings), null);
        }
        if (response.rebuildID !== void 0) {
          if (!rebuild) {
            let isDisposed = false;
            rebuild = () => new Promise((resolve, reject) => {
              if (isDisposed || isClosed)
                throw new Error("Cannot rebuild");
              sendRequest(refs, { command: "rebuild", rebuildID: response.rebuildID }, (error2, response2) => {
                if (error2) {
                  const message = { pluginName: "", text: error2, location: null, notes: [], detail: void 0 };
                  return callback2(failureErrorWithLog("Build failed", [message], []), null);
                }
                buildResponseToResult(response2, (error3, result3) => {
                  if (error3)
                    reject(error3);
                  else
                    resolve(result3);
                });
              });
            });
            refs.ref();
            rebuild.dispose = () => {
              if (isDisposed)
                return;
              isDisposed = true;
              sendRequest(refs, { command: "rebuild-dispose", rebuildID: response.rebuildID }, () => {
              });
              refs.unref();
            };
          }
          result.rebuild = rebuild;
        }
        if (response.watchID !== void 0) {
          if (!stop) {
            let isStopped = false;
            refs.ref();
            stop = () => {
              if (isStopped)
                return;
              isStopped = true;
              watchCallbacks.delete(response.watchID);
              sendRequest(refs, { command: "watch-stop", watchID: response.watchID }, () => {
              });
              refs.unref();
            };
            if (watch) {
              watchCallbacks.set(response.watchID, (serviceStopError, watchResponse) => {
                if (serviceStopError) {
                  if (watch.onRebuild)
                    watch.onRebuild(serviceStopError, null);
                  return;
                }
                let result2 = {
                  errors: replaceDetailsInMessages(watchResponse.errors, details),
                  warnings: replaceDetailsInMessages(watchResponse.warnings, details)
                };
                copyResponseToResult(watchResponse, result2);
                runOnEndCallbacks(result2, logPluginError, () => {
                  if (result2.errors.length > 0) {
                    if (watch.onRebuild)
                      watch.onRebuild(failureErrorWithLog("Build failed", result2.errors, result2.warnings), null);
                    return;
                  }
                  if (watchResponse.rebuildID !== void 0)
                    result2.rebuild = rebuild;
                  result2.stop = stop;
                  if (watch.onRebuild)
                    watch.onRebuild(null, result2);
                });
              });
            }
          }
          result.stop = stop;
        }
        callback2(null, result);
      });
    };
    if (write && streamIn.isBrowser)
      throw new Error(`Cannot enable "write" in the browser`);
    if (incremental && streamIn.isSync)
      throw new Error(`Cannot use "incremental" with a synchronous build`);
    if (watch && streamIn.isSync)
      throw new Error(`Cannot use "watch" with a synchronous build`);
    sendRequest(refs, request, (error, response) => {
      if (error)
        return callback(new Error(error), null);
      if (serve2) {
        let serveResponse = response;
        let isStopped = false;
        refs.ref();
        let result = {
          port: serveResponse.port,
          host: serveResponse.host,
          wait: serve2.wait,
          stop() {
            if (isStopped)
              return;
            isStopped = true;
            serve2.stop();
            refs.unref();
          }
        };
        refs.ref();
        serve2.wait.then(refs.unref, refs.unref);
        return callback(null, result);
      }
      return buildResponseToResult(response, callback);
    });
  };
  let transform2 = ({ callName, refs, input, options, isTTY: isTTY2, fs: fs3, callback }) => {
    const details = createObjectStash();
    let start = (inputPath) => {
      try {
        if (typeof input !== "string")
          throw new Error('The input to "transform" must be a string');
        let flags = flagsForTransformOptions(callName, options, isTTY2, transformLogLevelDefault);
        let request = {
          command: "transform",
          flags,
          inputFS: inputPath !== null,
          input: inputPath !== null ? inputPath : input
        };
        sendRequest(refs, request, (error, response) => {
          if (error)
            return callback(new Error(error), null);
          let errors = replaceDetailsInMessages(response.errors, details);
          let warnings = replaceDetailsInMessages(response.warnings, details);
          let outstanding = 1;
          let next = () => --outstanding === 0 && callback(null, { warnings, code: response.code, map: response.map });
          if (errors.length > 0)
            return callback(failureErrorWithLog("Transform failed", errors, warnings), null);
          if (response.codeFS) {
            outstanding++;
            fs3.readFile(response.code, (err, contents) => {
              if (err !== null) {
                callback(err, null);
              } else {
                response.code = contents;
                next();
              }
            });
          }
          if (response.mapFS) {
            outstanding++;
            fs3.readFile(response.map, (err, contents) => {
              if (err !== null) {
                callback(err, null);
              } else {
                response.map = contents;
                next();
              }
            });
          }
          next();
        });
      } catch (e) {
        let flags = [];
        try {
          pushLogFlags(flags, options, {}, isTTY2, transformLogLevelDefault);
        } catch (e2) {
        }
        const error = extractErrorMessageV8(e, streamIn, details, void 0, "");
        sendRequest(refs, { command: "error", flags, error }, () => {
          error.detail = details.load(error.detail);
          callback(failureErrorWithLog("Transform failed", [error], []), null);
        });
      }
    };
    if (typeof input === "string" && input.length > 1024 * 1024) {
      let next = start;
      start = () => fs3.writeFile(input, next);
    }
    start(null);
  };
  let formatMessages2 = ({ callName, refs, messages, options, callback }) => {
    let result = sanitizeMessages(messages, "messages", null, "");
    if (!options)
      throw new Error(`Missing second argument in ${callName}() call`);
    let keys = {};
    let kind = getFlag(options, keys, "kind", mustBeString);
    let color = getFlag(options, keys, "color", mustBeBoolean);
    let terminalWidth = getFlag(options, keys, "terminalWidth", mustBeInteger);
    checkForInvalidFlags(options, keys, `in ${callName}() call`);
    if (kind === void 0)
      throw new Error(`Missing "kind" in ${callName}() call`);
    if (kind !== "error" && kind !== "warning")
      throw new Error(`Expected "kind" to be "error" or "warning" in ${callName}() call`);
    let request = {
      command: "format-msgs",
      messages: result,
      isWarning: kind === "warning"
    };
    if (color !== void 0)
      request.color = color;
    if (terminalWidth !== void 0)
      request.terminalWidth = terminalWidth;
    sendRequest(refs, request, (error, response) => {
      if (error)
        return callback(new Error(error), null);
      callback(null, response.messages);
    });
  };
  let analyzeMetafile2 = ({ callName, refs, metafile, options, callback }) => {
    if (options === void 0)
      options = {};
    let keys = {};
    let color = getFlag(options, keys, "color", mustBeBoolean);
    let verbose = getFlag(options, keys, "verbose", mustBeBoolean);
    checkForInvalidFlags(options, keys, `in ${callName}() call`);
    let request = {
      command: "analyze-metafile",
      metafile
    };
    if (color !== void 0)
      request.color = color;
    if (verbose !== void 0)
      request.verbose = verbose;
    sendRequest(refs, request, (error, response) => {
      if (error)
        return callback(new Error(error), null);
      callback(null, response.result);
    });
  };
  return {
    readFromStdout,
    afterClose,
    service: {
      buildOrServe,
      transform: transform2,
      formatMessages: formatMessages2,
      analyzeMetafile: analyzeMetafile2
    }
  };
}
function createObjectStash() {
  const map = new Map();
  let nextID = 0;
  return {
    load(id) {
      return map.get(id);
    },
    store(value) {
      if (value === void 0)
        return -1;
      const id = nextID++;
      map.set(id, value);
      return id;
    }
  };
}
function extractCallerV8(e, streamIn, ident) {
  let note;
  let tried = false;
  return () => {
    if (tried)
      return note;
    tried = true;
    try {
      let lines = (e.stack + "").split("\n");
      lines.splice(1, 1);
      let location = parseStackLinesV8(streamIn, lines, ident);
      if (location) {
        note = { text: e.message, location };
        return note;
      }
    } catch (e2) {
    }
  };
}
function extractErrorMessageV8(e, streamIn, stash, note, pluginName) {
  let text = "Internal error";
  let location = null;
  try {
    text = (e && e.message || e) + "";
  } catch (e2) {
  }
  try {
    location = parseStackLinesV8(streamIn, (e.stack + "").split("\n"), "");
  } catch (e2) {
  }
  return { pluginName, text, location, notes: note ? [note] : [], detail: stash ? stash.store(e) : -1 };
}
function parseStackLinesV8(streamIn, lines, ident) {
  let at = "    at ";
  if (streamIn.readFileSync && !lines[0].startsWith(at) && lines[1].startsWith(at)) {
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];
      if (!line.startsWith(at))
        continue;
      line = line.slice(at.length);
      while (true) {
        let match = /^(?:new |async )?\S+ \((.*)\)$/.exec(line);
        if (match) {
          line = match[1];
          continue;
        }
        match = /^eval at \S+ \((.*)\)(?:, \S+:\d+:\d+)?$/.exec(line);
        if (match) {
          line = match[1];
          continue;
        }
        match = /^(\S+):(\d+):(\d+)$/.exec(line);
        if (match) {
          let contents;
          try {
            contents = streamIn.readFileSync(match[1], "utf8");
          } catch (e) {
            break;
          }
          let lineText = contents.split(/\r\n|\r|\n|\u2028|\u2029/)[+match[2] - 1] || "";
          let column = +match[3] - 1;
          let length = lineText.slice(column, column + ident.length) === ident ? ident.length : 0;
          return {
            file: match[1],
            namespace: "file",
            line: +match[2],
            column: encodeUTF8(lineText.slice(0, column)).length,
            length: encodeUTF8(lineText.slice(column, column + length)).length,
            lineText: lineText + "\n" + lines.slice(1).join("\n"),
            suggestion: ""
          };
        }
        break;
      }
    }
  }
  return null;
}
function failureErrorWithLog(text, errors, warnings) {
  let limit = 5;
  let summary = errors.length < 1 ? "" : ` with ${errors.length} error${errors.length < 2 ? "" : "s"}:` + errors.slice(0, limit + 1).map((e, i) => {
    if (i === limit)
      return "\n...";
    if (!e.location)
      return `
error: ${e.text}`;
    let { file, line, column } = e.location;
    let pluginText = e.pluginName ? `[plugin: ${e.pluginName}] ` : "";
    return `
${file}:${line}:${column}: error: ${pluginText}${e.text}`;
  }).join("");
  let error = new Error(`${text}${summary}`);
  error.errors = errors;
  error.warnings = warnings;
  return error;
}
function replaceDetailsInMessages(messages, stash) {
  for (const message of messages) {
    message.detail = stash.load(message.detail);
  }
  return messages;
}
function sanitizeLocation(location, where) {
  if (location == null)
    return null;
  let keys = {};
  let file = getFlag(location, keys, "file", mustBeString);
  let namespace = getFlag(location, keys, "namespace", mustBeString);
  let line = getFlag(location, keys, "line", mustBeInteger);
  let column = getFlag(location, keys, "column", mustBeInteger);
  let length = getFlag(location, keys, "length", mustBeInteger);
  let lineText = getFlag(location, keys, "lineText", mustBeString);
  let suggestion = getFlag(location, keys, "suggestion", mustBeString);
  checkForInvalidFlags(location, keys, where);
  return {
    file: file || "",
    namespace: namespace || "",
    line: line || 0,
    column: column || 0,
    length: length || 0,
    lineText: lineText || "",
    suggestion: suggestion || ""
  };
}
function sanitizeMessages(messages, property, stash, fallbackPluginName) {
  let messagesClone = [];
  let index = 0;
  for (const message of messages) {
    let keys = {};
    let pluginName = getFlag(message, keys, "pluginName", mustBeString);
    let text = getFlag(message, keys, "text", mustBeString);
    let location = getFlag(message, keys, "location", mustBeObjectOrNull);
    let notes = getFlag(message, keys, "notes", mustBeArray);
    let detail = getFlag(message, keys, "detail", canBeAnything);
    let where = `in element ${index} of "${property}"`;
    checkForInvalidFlags(message, keys, where);
    let notesClone = [];
    if (notes) {
      for (const note of notes) {
        let noteKeys = {};
        let noteText = getFlag(note, noteKeys, "text", mustBeString);
        let noteLocation = getFlag(note, noteKeys, "location", mustBeObjectOrNull);
        checkForInvalidFlags(note, noteKeys, where);
        notesClone.push({
          text: noteText || "",
          location: sanitizeLocation(noteLocation, where)
        });
      }
    }
    messagesClone.push({
      pluginName: pluginName || fallbackPluginName,
      text: text || "",
      location: sanitizeLocation(location, where),
      notes: notesClone,
      detail: stash ? stash.store(detail) : -1
    });
    index++;
  }
  return messagesClone;
}
function sanitizeStringArray(values, property) {
  const result = [];
  for (const value of values) {
    if (typeof value !== "string")
      throw new Error(`${JSON.stringify(property)} must be an array of strings`);
    result.push(value);
  }
  return result;
}
function convertOutputFiles({ path: path3, contents }) {
  let text = null;
  return {
    path: path3,
    contents,
    get text() {
      if (text === null)
        text = decodeUTF8(contents);
      return text;
    }
  };
}

// lib/npm/node-platform.ts
var fs = require("fs");
var os = require("os");
var path = require("path");
var ESBUILD_BINARY_PATH = process.env.ESBUILD_BINARY_PATH || ESBUILD_BINARY_PATH;
var knownWindowsPackages = {
  "win32 arm64 LE": "esbuild-windows-arm64",
  "win32 ia32 LE": "esbuild-windows-32",
  "win32 x64 LE": "esbuild-windows-64"
};
var knownUnixlikePackages = {
  "android arm64 LE": "esbuild-android-arm64",
  "darwin arm64 LE": "esbuild-darwin-arm64",
  "darwin x64 LE": "esbuild-darwin-64",
  "freebsd arm64 LE": "esbuild-freebsd-arm64",
  "freebsd x64 LE": "esbuild-freebsd-64",
  "linux arm LE": "esbuild-linux-arm",
  "linux arm64 LE": "esbuild-linux-arm64",
  "linux ia32 LE": "esbuild-linux-32",
  "linux mips64el LE": "esbuild-linux-mips64le",
  "linux ppc64 LE": "esbuild-linux-ppc64le",
  "linux x64 LE": "esbuild-linux-64",
  "netbsd x64 LE": "esbuild-netbsd-64",
  "openbsd x64 LE": "esbuild-openbsd-64",
  "sunos x64 LE": "esbuild-sunos-64"
};
function pkgAndSubpathForCurrentPlatform() {
  let pkg;
  let subpath;
  let platformKey = `${process.platform} ${os.arch()} ${os.endianness()}`;
  if (platformKey in knownWindowsPackages) {
    pkg = knownWindowsPackages[platformKey];
    subpath = "esbuild.exe";
  } else if (platformKey in knownUnixlikePackages) {
    pkg = knownUnixlikePackages[platformKey];
    subpath = "bin/esbuild";
  } else {
    throw new Error(`Unsupported platform: ${platformKey}`);
  }
  return { pkg, subpath };
}
function downloadedBinPath(pkg, subpath) {
  const esbuildLibDir = path.dirname(require.resolve("esbuild"));
  return path.join(esbuildLibDir, `downloaded-${pkg}-${path.basename(subpath)}`);
}
function generateBinPath() {
  if (ESBUILD_BINARY_PATH) {
    return ESBUILD_BINARY_PATH;
  }
  const { pkg, subpath } = pkgAndSubpathForCurrentPlatform();
  let binPath;
  try {
    binPath = require.resolve(`${pkg}/${subpath}`);
  } catch (e) {
    binPath = downloadedBinPath(pkg, subpath);
    if (!fs.existsSync(binPath)) {
      try {
        require.resolve(pkg);
      } catch (e2) {
        throw new Error(`The package "${pkg}" could not be found, and is needed by esbuild.

If you are installing esbuild with npm, make sure that you don't specify the
"--no-optional" flag. The "optionalDependencies" package.json feature is used
by esbuild to install the correct binary executable for your current platform.`);
      }
      throw e;
    }
  }
  let isYarnPnP = false;
  try {
    require("pnpapi");
    isYarnPnP = true;
  } catch (e) {
  }
  if (isYarnPnP) {
    const esbuildLibDir = path.dirname(require.resolve("esbuild"));
    const binTargetPath = path.join(esbuildLibDir, `pnpapi-${pkg}-${path.basename(subpath)}`);
    if (!fs.existsSync(binTargetPath)) {
      fs.copyFileSync(binPath, binTargetPath);
      fs.chmodSync(binTargetPath, 493);
    }
    return binTargetPath;
  }
  return binPath;
}

// lib/npm/node.ts
var child_process = require("child_process");
var crypto = require("crypto");
var path2 = require("path");
var fs2 = require("fs");
var os2 = require("os");
var tty = require("tty");
var worker_threads;
if (process.env.ESBUILD_WORKER_THREADS !== "0") {
  try {
    worker_threads = require("worker_threads");
  } catch (e) {
  }
  let [major, minor] = process.versions.node.split(".");
  if (+major < 12 || +major === 12 && +minor < 17 || +major === 13 && +minor < 13) {
    worker_threads = void 0;
  }
}
var _a;
var isInternalWorkerThread = ((_a = worker_threads == null ? void 0 : worker_threads.workerData) == null ? void 0 : _a.esbuildVersion) === "0.13.9";
var esbuildCommandAndArgs = () => {
  if ((!ESBUILD_BINARY_PATH || false) && (path2.basename(__filename) !== "main.js" || path2.basename(__dirname) !== "lib")) {
    throw new Error(`The esbuild JavaScript API cannot be bundled. Please mark the "esbuild" package as external so it's not included in the bundle.

More information: The file containing the code for esbuild's JavaScript API (${__filename}) does not appear to be inside the esbuild package on the file system, which usually means that the esbuild package was bundled into another file. This is problematic because the API needs to run a binary executable inside the esbuild package which is located using a relative path from the API code to the executable. If the esbuild package is bundled, the relative path will be incorrect and the executable won't be found.`);
  }
  if (false) {
    return ["node", [path2.join(__dirname, "..", "bin", "esbuild")]];
  }
  return [generateBinPath(), []];
};
var isTTY = () => tty.isatty(2);
var fsSync = {
  readFile(tempFile, callback) {
    try {
      let contents = fs2.readFileSync(tempFile, "utf8");
      try {
        fs2.unlinkSync(tempFile);
      } catch (e) {
      }
      callback(null, contents);
    } catch (err) {
      callback(err, null);
    }
  },
  writeFile(contents, callback) {
    try {
      let tempFile = randomFileName();
      fs2.writeFileSync(tempFile, contents);
      callback(tempFile);
    } catch (e) {
      callback(null);
    }
  }
};
var fsAsync = {
  readFile(tempFile, callback) {
    try {
      fs2.readFile(tempFile, "utf8", (err, contents) => {
        try {
          fs2.unlink(tempFile, () => callback(err, contents));
        } catch (e) {
          callback(err, contents);
        }
      });
    } catch (err) {
      callback(err, null);
    }
  },
  writeFile(contents, callback) {
    try {
      let tempFile = randomFileName();
      fs2.writeFile(tempFile, contents, (err) => err !== null ? callback(null) : callback(tempFile));
    } catch (e) {
      callback(null);
    }
  }
};
var version = "0.13.9";
var build = (options) => ensureServiceIsRunning().build(options);
var serve = (serveOptions, buildOptions) => ensureServiceIsRunning().serve(serveOptions, buildOptions);
var transform = (input, options) => ensureServiceIsRunning().transform(input, options);
var formatMessages = (messages, options) => ensureServiceIsRunning().formatMessages(messages, options);
var analyzeMetafile = (messages, options) => ensureServiceIsRunning().analyzeMetafile(messages, options);
var buildSync = (options) => {
  if (worker_threads && !isInternalWorkerThread) {
    if (!workerThreadService)
      workerThreadService = startWorkerThreadService(worker_threads);
    return workerThreadService.buildSync(options);
  }
  let result;
  runServiceSync((service) => service.buildOrServe({
    callName: "buildSync",
    refs: null,
    serveOptions: null,
    options,
    isTTY: isTTY(),
    defaultWD,
    callback: (err, res) => {
      if (err)
        throw err;
      result = res;
    }
  }));
  return result;
};
var transformSync = (input, options) => {
  if (worker_threads && !isInternalWorkerThread) {
    if (!workerThreadService)
      workerThreadService = startWorkerThreadService(worker_threads);
    return workerThreadService.transformSync(input, options);
  }
  let result;
  runServiceSync((service) => service.transform({
    callName: "transformSync",
    refs: null,
    input,
    options: options || {},
    isTTY: isTTY(),
    fs: fsSync,
    callback: (err, res) => {
      if (err)
        throw err;
      result = res;
    }
  }));
  return result;
};
var formatMessagesSync = (messages, options) => {
  if (worker_threads && !isInternalWorkerThread) {
    if (!workerThreadService)
      workerThreadService = startWorkerThreadService(worker_threads);
    return workerThreadService.formatMessagesSync(messages, options);
  }
  let result;
  runServiceSync((service) => service.formatMessages({
    callName: "formatMessagesSync",
    refs: null,
    messages,
    options,
    callback: (err, res) => {
      if (err)
        throw err;
      result = res;
    }
  }));
  return result;
};
var analyzeMetafileSync = (metafile, options) => {
  if (worker_threads && !isInternalWorkerThread) {
    if (!workerThreadService)
      workerThreadService = startWorkerThreadService(worker_threads);
    return workerThreadService.analyzeMetafileSync(metafile, options);
  }
  let result;
  runServiceSync((service) => service.analyzeMetafile({
    callName: "analyzeMetafileSync",
    refs: null,
    metafile: typeof metafile === "string" ? metafile : JSON.stringify(metafile),
    options,
    callback: (err, res) => {
      if (err)
        throw err;
      result = res;
    }
  }));
  return result;
};
var initializeWasCalled = false;
var initialize = (options) => {
  options = validateInitializeOptions(options || {});
  if (options.wasmURL)
    throw new Error(`The "wasmURL" option only works in the browser`);
  if (options.worker)
    throw new Error(`The "worker" option only works in the browser`);
  if (initializeWasCalled)
    throw new Error('Cannot call "initialize" more than once');
  ensureServiceIsRunning();
  initializeWasCalled = true;
  return Promise.resolve();
};
var defaultWD = process.cwd();
var longLivedService;
var ensureServiceIsRunning = () => {
  if (longLivedService)
    return longLivedService;
  let [command, args] = esbuildCommandAndArgs();
  let child = child_process.spawn(command, args.concat(`--service=${"0.13.9"}`, "--ping"), {
    windowsHide: true,
    stdio: ["pipe", "pipe", "inherit"],
    cwd: defaultWD
  });
  let { readFromStdout, afterClose, service } = createChannel({
    writeToStdin(bytes) {
      child.stdin.write(bytes);
    },
    readFileSync: fs2.readFileSync,
    isSync: false,
    isBrowser: false
  });
  const stdin = child.stdin;
  const stdout = child.stdout;
  stdout.on("data", readFromStdout);
  stdout.on("end", afterClose);
  let refCount = 0;
  child.unref();
  if (stdin.unref) {
    stdin.unref();
  }
  if (stdout.unref) {
    stdout.unref();
  }
  const refs = {
    ref() {
      if (++refCount === 1)
        child.ref();
    },
    unref() {
      if (--refCount === 0)
        child.unref();
    }
  };
  longLivedService = {
    build: (options) => {
      return new Promise((resolve, reject) => {
        service.buildOrServe({
          callName: "build",
          refs,
          serveOptions: null,
          options,
          isTTY: isTTY(),
          defaultWD,
          callback: (err, res) => err ? reject(err) : resolve(res)
        });
      });
    },
    serve: (serveOptions, buildOptions) => {
      if (serveOptions === null || typeof serveOptions !== "object")
        throw new Error("The first argument must be an object");
      return new Promise((resolve, reject) => service.buildOrServe({
        callName: "serve",
        refs,
        serveOptions,
        options: buildOptions,
        isTTY: isTTY(),
        defaultWD,
        callback: (err, res) => err ? reject(err) : resolve(res)
      }));
    },
    transform: (input, options) => {
      return new Promise((resolve, reject) => service.transform({
        callName: "transform",
        refs,
        input,
        options: options || {},
        isTTY: isTTY(),
        fs: fsAsync,
        callback: (err, res) => err ? reject(err) : resolve(res)
      }));
    },
    formatMessages: (messages, options) => {
      return new Promise((resolve, reject) => service.formatMessages({
        callName: "formatMessages",
        refs,
        messages,
        options,
        callback: (err, res) => err ? reject(err) : resolve(res)
      }));
    },
    analyzeMetafile: (metafile, options) => {
      return new Promise((resolve, reject) => service.analyzeMetafile({
        callName: "analyzeMetafile",
        refs,
        metafile: typeof metafile === "string" ? metafile : JSON.stringify(metafile),
        options,
        callback: (err, res) => err ? reject(err) : resolve(res)
      }));
    }
  };
  return longLivedService;
};
var runServiceSync = (callback) => {
  let [command, args] = esbuildCommandAndArgs();
  let stdin = new Uint8Array();
  let { readFromStdout, afterClose, service } = createChannel({
    writeToStdin(bytes) {
      if (stdin.length !== 0)
        throw new Error("Must run at most one command");
      stdin = bytes;
    },
    isSync: true,
    isBrowser: false
  });
  callback(service);
  let stdout = child_process.execFileSync(command, args.concat(`--service=${"0.13.9"}`), {
    cwd: defaultWD,
    windowsHide: true,
    input: stdin,
    maxBuffer: +process.env.ESBUILD_MAX_BUFFER || 16 * 1024 * 1024
  });
  readFromStdout(stdout);
  afterClose();
};
var randomFileName = () => {
  return path2.join(os2.tmpdir(), `esbuild-${crypto.randomBytes(32).toString("hex")}`);
};
var workerThreadService = null;
var startWorkerThreadService = (worker_threads2) => {
  let { port1: mainPort, port2: workerPort } = new worker_threads2.MessageChannel();
  let worker = new worker_threads2.Worker(__filename, {
    workerData: { workerPort, defaultWD, esbuildVersion: "0.13.9" },
    transferList: [workerPort],
    execArgv: []
  });
  let nextID = 0;
  let wasStopped = false;
  let fakeBuildError = (text) => {
    let error = new Error(`Build failed with 1 error:
error: ${text}`);
    let errors = [{ pluginName: "", text, location: null, notes: [], detail: void 0 }];
    error.errors = errors;
    error.warnings = [];
    return error;
  };
  let validateBuildSyncOptions = (options) => {
    if (!options)
      return;
    let plugins = options.plugins;
    let incremental = options.incremental;
    let watch = options.watch;
    if (plugins && plugins.length > 0)
      throw fakeBuildError(`Cannot use plugins in synchronous API calls`);
    if (incremental)
      throw fakeBuildError(`Cannot use "incremental" with a synchronous build`);
    if (watch)
      throw fakeBuildError(`Cannot use "watch" with a synchronous build`);
  };
  let applyProperties = (object, properties) => {
    for (let key in properties) {
      object[key] = properties[key];
    }
  };
  let runCallSync = (command, args) => {
    if (wasStopped)
      throw new Error("The service was stopped");
    let id = nextID++;
    let sharedBuffer = new SharedArrayBuffer(8);
    let sharedBufferView = new Int32Array(sharedBuffer);
    let msg = { sharedBuffer, id, command, args };
    worker.postMessage(msg);
    let status = Atomics.wait(sharedBufferView, 0, 0);
    if (status !== "ok" && status !== "not-equal")
      throw new Error("Internal error: Atomics.wait() failed: " + status);
    let { message: { id: id2, resolve, reject, properties } } = worker_threads2.receiveMessageOnPort(mainPort);
    if (id !== id2)
      throw new Error(`Internal error: Expected id ${id} but got id ${id2}`);
    if (reject) {
      applyProperties(reject, properties);
      throw reject;
    }
    return resolve;
  };
  worker.unref();
  return {
    buildSync(options) {
      validateBuildSyncOptions(options);
      return runCallSync("build", [options]);
    },
    transformSync(input, options) {
      return runCallSync("transform", [input, options]);
    },
    formatMessagesSync(messages, options) {
      return runCallSync("formatMessages", [messages, options]);
    },
    analyzeMetafileSync(metafile, options) {
      return runCallSync("analyzeMetafile", [metafile, options]);
    }
  };
};
var startSyncServiceWorker = () => {
  let workerPort = worker_threads.workerData.workerPort;
  let parentPort = worker_threads.parentPort;
  let service = ensureServiceIsRunning();
  defaultWD = worker_threads.workerData.defaultWD;
  let extractProperties = (object) => {
    let properties = {};
    if (object && typeof object === "object") {
      for (let key in object) {
        properties[key] = object[key];
      }
    }
    return properties;
  };
  parentPort.on("message", (msg) => {
    (async () => {
      let { sharedBuffer, id, command, args } = msg;
      let sharedBufferView = new Int32Array(sharedBuffer);
      try {
        switch (command) {
          case "build":
            workerPort.postMessage({ id, resolve: await service.build(args[0]) });
            break;
          case "transform":
            workerPort.postMessage({ id, resolve: await service.transform(args[0], args[1]) });
            break;
          case "formatMessages":
            workerPort.postMessage({ id, resolve: await service.formatMessages(args[0], args[1]) });
            break;
          case "analyzeMetafile":
            workerPort.postMessage({ id, resolve: await service.analyzeMetafile(args[0], args[1]) });
            break;
          default:
            throw new Error(`Invalid command: ${command}`);
        }
      } catch (reject) {
        workerPort.postMessage({ id, reject, properties: extractProperties(reject) });
      }
      Atomics.add(sharedBufferView, 0, 1);
      Atomics.notify(sharedBufferView, 0, Infinity);
    })();
  });
};
if (isInternalWorkerThread) {
  startSyncServiceWorker();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  analyzeMetafile,
  analyzeMetafileSync,
  build,
  buildSync,
  formatMessages,
  formatMessagesSync,
  initialize,
  serve,
  transform,
  transformSync,
  version
});
