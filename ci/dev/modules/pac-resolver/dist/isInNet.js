"use strict";
/**
 * Module dependencies.
 */
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
const netmask_1 = require("netmask");
const util_1 = require("./util");
/**
 * True iff the IP address of the host matches the specified IP address pattern.
 *
 * Pattern and mask specification is done the same way as for SOCKS configuration.
 *
 * Examples:
 *
 * ``` js
 * isInNet(host, "198.95.249.79", "255.255.255.255")
 *   // is true iff the IP address of host matches exactly 198.95.249.79.
 *
 * isInNet(host, "198.95.0.0", "255.255.0.0")
 *   // is true iff the IP address of the host matches 198.95.*.*.
 * ```
 *
 * @param {String} host a DNS hostname, or IP address. If a hostname is passed,
 *   it will be resoved into an IP address by this function.
 * @param {String} pattern an IP address pattern in the dot-separated format mask.
 * @param {String} mask for the IP address pattern informing which parts of the
 *   IP address should be matched against. 0 means ignore, 255 means match.
 * @return {Boolean}
 */
function isInNet(host, pattern, mask) {
    return __awaiter(this, void 0, void 0, function* () {
        const family = 4;
        try {
            const ip = yield util_1.dnsLookup(host, { family });
            if (typeof ip === 'string') {
                const netmask = new netmask_1.Netmask(pattern, mask);
                return netmask.contains(ip);
            }
        }
        catch (err) { }
        return false;
    });
}
exports.default = isInNet;
//# sourceMappingURL=isInNet.js.map