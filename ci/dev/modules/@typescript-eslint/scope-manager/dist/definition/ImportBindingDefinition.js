"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportBindingDefinition = void 0;
const DefinitionType_1 = require("./DefinitionType");
const DefinitionBase_1 = require("./DefinitionBase");
class ImportBindingDefinition extends DefinitionBase_1.DefinitionBase {
    constructor(name, node, decl) {
        super(DefinitionType_1.DefinitionType.ImportBinding, name, node, decl);
        this.isTypeDefinition = true;
        this.isVariableDefinition = true;
    }
}
exports.ImportBindingDefinition = ImportBindingDefinition;
//# sourceMappingURL=ImportBindingDefinition.js.map