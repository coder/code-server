"use strict";
/* eslint-disable @typescript-eslint/no-namespace */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIEngine = void 0;
const eslint_1 = require("eslint");
/**
 * The underlying utility that runs the ESLint command line interface. This object will read the filesystem for
 * configuration and file information but will not output any results. Instead, it allows you direct access to the
 * important information so you can deal with the output yourself.
 * @deprecated use the ESLint class instead
 */
class CLIEngine extends eslint_1.CLIEngine {
}
exports.CLIEngine = CLIEngine;
//# sourceMappingURL=CLIEngine.js.map