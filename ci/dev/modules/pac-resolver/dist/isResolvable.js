"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
/**
 * Tries to resolve the hostname. Returns true if succeeds.
 *
 * @param {String} host is the hostname from the URL.
 * @return {Boolean}
 */
function isResolvable(host) {
    return __awaiter(this, void 0, void 0, function* () {
        const family = 4;
        try {
            if (yield util_1.dnsLookup(host, { family })) {
                return true;
            }
        }
        catch (err) {
            // ignore
        }
        return false;
    });
}
exports.default = isResolvable;
//# sourceMappingURL=isResolvable.js.map