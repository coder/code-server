"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const util = __importStar(require("../util"));
const baseRule = (() => {
    try {
        return require('eslint/lib/rules/no-loss-of-precision');
    }
    catch (_a) {
        /* istanbul ignore next */
        return null;
    }
})();
exports.default = util.createRule({
    name: 'no-loss-of-precision',
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow literal numbers that lose precision',
            category: 'Possible Errors',
            recommended: false,
            extendsBaseRule: true,
        },
        schema: [],
        messages: (_a = baseRule === null || baseRule === void 0 ? void 0 : baseRule.meta.messages) !== null && _a !== void 0 ? _a : { noLossOfPrecision: '' },
    },
    defaultOptions: [],
    create(context) {
        /* istanbul ignore if */ if (baseRule === null) {
            throw new Error('@typescript-eslint/no-loss-of-precision requires at least ESLint v7.1.0');
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const rules = baseRule.create(context);
        function isSeparatedNumeric(node) {
            return typeof node.value === 'number' && node.raw.includes('_');
        }
        return {
            Literal(node) {
                rules.Literal(Object.assign(Object.assign({}, node), { raw: isSeparatedNumeric(node) ? node.raw.replace(/_/g, '') : node.raw }));
            },
        };
    },
});
//# sourceMappingURL=no-loss-of-precision.js.map