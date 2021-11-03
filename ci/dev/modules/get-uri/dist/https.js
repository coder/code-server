"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("./http"));
/**
 * Returns a Readable stream from an "https:" URI.
 */
function get(parsed, opts) {
    return http_1.default(parsed, Object.assign(Object.assign({}, opts), { http: https_1.default }));
}
exports.default = get;
//# sourceMappingURL=https.js.map