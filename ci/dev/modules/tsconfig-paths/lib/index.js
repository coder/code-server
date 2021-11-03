"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// register is used from register.js in root dir
var match_path_sync_1 = require("./match-path-sync");
exports.createMatchPath = match_path_sync_1.createMatchPath;
exports.matchFromAbsolutePaths = match_path_sync_1.matchFromAbsolutePaths;
var match_path_async_1 = require("./match-path-async");
exports.createMatchPathAsync = match_path_async_1.createMatchPathAsync;
exports.matchFromAbsolutePathsAsync = match_path_async_1.matchFromAbsolutePathsAsync;
var register_1 = require("./register");
exports.register = register_1.register;
var config_loader_1 = require("./config-loader");
exports.loadConfig = config_loader_1.loadConfig;
