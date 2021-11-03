"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSEnumNameDefinition = void 0;
const DefinitionType_1 = require("./DefinitionType");
const DefinitionBase_1 = require("./DefinitionBase");
class TSEnumNameDefinition extends DefinitionBase_1.DefinitionBase {
    constructor(name, node) {
        super(DefinitionType_1.DefinitionType.TSEnumName, name, node, null);
        this.isTypeDefinition = true;
        this.isVariableDefinition = true;
    }
}
exports.TSEnumNameDefinition = TSEnumNameDefinition;
//# sourceMappingURL=TSEnumNameDefinition.js.map