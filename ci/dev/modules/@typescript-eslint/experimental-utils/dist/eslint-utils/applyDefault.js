"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDefault = void 0;
const deepMerge_1 = require("./deepMerge");
/**
 * Pure function - doesn't mutate either parameter!
 * Uses the default options and overrides with the options provided by the user
 * @param defaultOptions the defaults
 * @param userOptions the user opts
 * @returns the options with defaults
 */
function applyDefault(defaultOptions, userOptions) {
    // clone defaults
    const options = JSON.parse(JSON.stringify(defaultOptions));
    if (userOptions === null || userOptions === undefined) {
        return options;
    }
    options.forEach((opt, i) => {
        if (userOptions[i] !== undefined) {
            const userOpt = userOptions[i];
            if (deepMerge_1.isObjectNotArray(userOpt) && deepMerge_1.isObjectNotArray(opt)) {
                options[i] = deepMerge_1.deepMerge(opt, userOpt);
            }
            else {
                options[i] = userOpt;
            }
        }
    });
    return options;
}
exports.applyDefault = applyDefault;
//# sourceMappingURL=applyDefault.js.map