"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithScope = void 0;
const ScopeBase_1 = require("./ScopeBase");
const ScopeType_1 = require("./ScopeType");
const assert_1 = require("../assert");
class WithScope extends ScopeBase_1.ScopeBase {
    constructor(scopeManager, upperScope, block) {
        super(scopeManager, ScopeType_1.ScopeType.with, upperScope, block, false);
    }
    close(scopeManager) {
        if (this.shouldStaticallyClose()) {
            return super.close(scopeManager);
        }
        assert_1.assert(this.leftToResolve);
        for (let i = 0; i < this.leftToResolve.length; ++i) {
            const ref = this.leftToResolve[i];
            this.delegateToUpperScope(ref);
        }
        this.leftToResolve = null;
        return this.upper;
    }
}
exports.WithScope = WithScope;
//# sourceMappingURL=WithScope.js.map