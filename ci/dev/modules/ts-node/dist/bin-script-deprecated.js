#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bin_1 = require("./bin");
console.warn('ts-script has been deprecated and will be removed in the next major release.', 'Please use ts-node-script instead');
bin_1.main(undefined, { '--script-mode': true });
//# sourceMappingURL=bin-script-deprecated.js.map