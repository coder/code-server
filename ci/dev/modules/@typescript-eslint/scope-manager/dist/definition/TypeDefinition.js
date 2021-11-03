"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeDefinition = void 0;
const DefinitionType_1 = require("./DefinitionType");
const DefinitionBase_1 = require("./DefinitionBase");
class TypeDefinition extends DefinitionBase_1.DefinitionBase {
    constructor(name, node) {
        super(DefinitionType_1.DefinitionType.Type, name, node, null);
        this.isTypeDefinition = true;
        this.isVariableDefinition = false;
    }
}
exports.TypeDefinition = TypeDefinition;
//# sourceMappingURL=TypeDefinition.js.map