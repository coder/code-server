"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleCreator = void 0;
const applyDefault_1 = require("./applyDefault");
function RuleCreator(urlCreator) {
    // This function will get much easier to call when this is merged https://github.com/Microsoft/TypeScript/pull/26349
    // TODO - when the above PR lands; add type checking for the context.report `data` property
    return function createRule({ name, meta, defaultOptions, create, }) {
        return {
            meta: Object.assign(Object.assign({}, meta), { docs: Object.assign(Object.assign({}, meta.docs), { url: urlCreator(name) }) }),
            create(context) {
                const optionsWithDefault = applyDefault_1.applyDefault(defaultOptions, context.options);
                return create(context, optionsWithDefault);
            },
        };
    };
}
exports.RuleCreator = RuleCreator;
//# sourceMappingURL=RuleCreator.js.map