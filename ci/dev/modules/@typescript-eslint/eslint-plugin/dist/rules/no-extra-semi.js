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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const no_extra_semi_1 = __importDefault(require("eslint/lib/rules/no-extra-semi"));
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'no-extra-semi',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow unnecessary semicolons',
            category: 'Possible Errors',
            recommended: 'error',
            extendsBaseRule: true,
        },
        fixable: 'code',
        schema: no_extra_semi_1.default.meta.schema,
        messages: no_extra_semi_1.default.meta.messages,
    },
    defaultOptions: [],
    create(context) {
        const rules = no_extra_semi_1.default.create(context);
        return Object.assign(Object.assign({}, rules), { ClassProperty(node) {
                rules.MethodDefinition(node);
            } });
    },
});
//# sourceMappingURL=no-extra-semi.js.map