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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ip_1 = __importDefault(require("ip"));
const net_1 = __importDefault(require("net"));
/**
 * Returns the IP address of the host that the Navigator is running on, as
 * a string in the dot-separated integer format.
 *
 * Example:
 *
 * ``` js
 * myIpAddress()
 *   // would return the string "198.95.249.79" if you were running the
 *   // Navigator on that host.
 * ```
 *
 * @return {String} external IP address
 */
function myIpAddress() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            // 8.8.8.8:53 is "Google Public DNS":
            // https://developers.google.com/speed/public-dns/
            const socket = net_1.default.connect({ host: '8.8.8.8', port: 53 });
            const onError = (err) => {
                // if we fail to access Google DNS (as in firewall blocks access),
                // fallback to querying IP locally
                resolve(ip_1.default.address());
            };
            socket.once('error', onError);
            socket.once('connect', () => {
                socket.removeListener('error', onError);
                const addr = socket.address();
                socket.destroy();
                if (typeof addr === 'string') {
                    resolve(addr);
                }
                else if (addr.address) {
                    resolve(addr.address);
                }
                else {
                    reject(new Error('Expected a `string`'));
                }
            });
        });
    });
}
exports.default = myIpAddress;
//# sourceMappingURL=myIpAddress.js.map