"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSModuleNameDefinition = void 0;
const DefinitionType_1 = require("./DefinitionType");
const DefinitionBase_1 = require("./DefinitionBase");
class TSModuleNameDefinition extends DefinitionBase_1.DefinitionBase {
    constructor(name, node) {
        super(DefinitionType_1.DefinitionType.TSModuleName, name, node, null);
        this.isTypeDefinition = true;
        this.isVariableDefinition = true;
    }
}
exports.TSModuleNameDefinition = TSModuleNameDefinition;
//# sourceMappingURL=TSModuleNameDefinition.js.map