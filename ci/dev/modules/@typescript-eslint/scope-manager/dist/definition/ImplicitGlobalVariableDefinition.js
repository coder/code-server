"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImplicitGlobalVariableDefinition = void 0;
const DefinitionType_1 = require("./DefinitionType");
const DefinitionBase_1 = require("./DefinitionBase");
class ImplicitGlobalVariableDefinition extends DefinitionBase_1.DefinitionBase {
    constructor(name, node) {
        super(DefinitionType_1.DefinitionType.ImplicitGlobalVariable, name, node, null);
        this.isTypeDefinition = false;
        this.isVariableDefinition = true;
    }
}
exports.ImplicitGlobalVariableDefinition = ImplicitGlobalVariableDefinition;
//# sourceMappingURL=ImplicitGlobalVariableDefinition.js.map