"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassNameDefinition = void 0;
const DefinitionType_1 = require("./DefinitionType");
const DefinitionBase_1 = require("./DefinitionBase");
class ClassNameDefinition extends DefinitionBase_1.DefinitionBase {
    constructor(name, node) {
        super(DefinitionType_1.DefinitionType.ClassName, name, node, null);
        this.isTypeDefinition = true;
        this.isVariableDefinition = true;
    }
}
exports.ClassNameDefinition = ClassNameDefinition;
//# sourceMappingURL=ClassNameDefinition.js.map