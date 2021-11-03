"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
// tslint:disable:no-require-imports
var JSON5 = require("json5");
var StripBom = require("strip-bom");
function tsConfigLoader(_a) {
    var getEnv = _a.getEnv, cwd = _a.cwd, _b = _a.loadSync, loadSync = _b === void 0 ? loadSyncDefault : _b;
    var TS_NODE_PROJECT = getEnv("TS_NODE_PROJECT");
    // tsconfig.loadSync handles if TS_NODE_PROJECT is a file or directory
    var loadResult = loadSync(cwd, TS_NODE_PROJECT);
    return loadResult;
}
exports.tsConfigLoader = tsConfigLoader;
function loadSyncDefault(cwd, filename) {
    // Tsconfig.loadSync uses path.resolve. This is why we can use an absolute path as filename
    var configPath = resolveConfigPath(cwd, filename);
    if (!configPath) {
        return {
            tsConfigPath: undefined,
            baseUrl: undefined,
            paths: undefined
        };
    }
    var config = loadTsconfig(configPath);
    return {
        tsConfigPath: configPath,
        baseUrl: config && config.compilerOptions && config.compilerOptions.baseUrl,
        paths: config && config.compilerOptions && config.compilerOptions.paths
    };
}
function resolveConfigPath(cwd, filename) {
    if (filename) {
        var absolutePath = fs.lstatSync(filename).isDirectory()
            ? path.resolve(filename, "./tsconfig.json")
            : path.resolve(cwd, filename);
        return absolutePath;
    }
    if (fs.statSync(cwd).isFile()) {
        return path.resolve(cwd);
    }
    var configAbsolutePath = walkForTsConfig(cwd);
    return configAbsolutePath ? path.resolve(configAbsolutePath) : undefined;
}
function walkForTsConfig(directory, existsSync) {
    if (existsSync === void 0) { existsSync = fs.existsSync; }
    var configPath = path.join(directory, "./tsconfig.json");
    if (existsSync(configPath)) {
        return configPath;
    }
    var parentDirectory = path.join(directory, "../");
    // If we reached the top
    if (directory === parentDirectory) {
        return undefined;
    }
    return walkForTsConfig(parentDirectory, existsSync);
}
exports.walkForTsConfig = walkForTsConfig;
function loadTsconfig(configFilePath, existsSync, readFileSync) {
    if (existsSync === void 0) { existsSync = fs.existsSync; }
    if (readFileSync === void 0) { readFileSync = function (filename) {
        return fs.readFileSync(filename, "utf8");
    }; }
    if (!existsSync(configFilePath)) {
        return undefined;
    }
    var configString = readFileSync(configFilePath);
    var cleanedJson = StripBom(configString);
    var config = JSON5.parse(cleanedJson);
    var extendedConfig = config.extends;
    if (extendedConfig) {
        if (typeof extendedConfig === "string" &&
            extendedConfig.indexOf(".json") === -1) {
            extendedConfig += ".json";
        }
        var currentDir = path.dirname(configFilePath);
        var base = loadTsconfig(path.join(currentDir, extendedConfig), existsSync, readFileSync) || {};
        // baseUrl should be interpreted as relative to the base tsconfig,
        // but we need to update it so it is relative to the original tsconfig being loaded
        if (base && base.compilerOptions && base.compilerOptions.baseUrl) {
            var extendsDir = path.dirname(extendedConfig);
            base.compilerOptions.baseUrl = path.join(extendsDir, base.compilerOptions.baseUrl);
        }
        return __assign({}, base, config, { compilerOptions: __assign({}, base.compilerOptions, config.compilerOptions) });
    }
    return config;
}
exports.loadTsconfig = loadTsconfig;
