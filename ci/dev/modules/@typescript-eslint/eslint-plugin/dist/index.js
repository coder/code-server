"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const rules_1 = __importDefault(require("./rules"));
const all_1 = __importDefault(require("./configs/all"));
const base_1 = __importDefault(require("./configs/base"));
const recommended_1 = __importDefault(require("./configs/recommended"));
const recommended_requiring_type_checking_1 = __importDefault(require("./configs/recommended-requiring-type-checking"));
const eslint_recommended_1 = __importDefault(require("./configs/eslint-recommended"));
module.exports = {
    rules: rules_1.default,
    configs: {
        all: all_1.default,
        base: base_1.default,
        recommended: recommended_1.default,
        'eslint-recommended': eslint_recommended_1.default,
        'recommended-requiring-type-checking': recommended_requiring_type_checking_1.default,
    },
};
//# sourceMappingURL=index.js.map