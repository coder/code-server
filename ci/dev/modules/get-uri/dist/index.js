"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const debug_1 = __importDefault(require("debug"));
const url_1 = require("url");
// Built-in protocols
const data_1 = __importDefault(require("./data"));
const file_1 = __importDefault(require("./file"));
const ftp_1 = __importDefault(require("./ftp"));
const http_1 = __importDefault(require("./http"));
const https_1 = __importDefault(require("./https"));
const debug = debug_1.default('get-uri');
function getUri(uri, opts, fn) {
    const p = new Promise((resolve, reject) => {
        debug('getUri(%o)', uri);
        if (typeof opts === 'function') {
            fn = opts;
            opts = undefined;
        }
        if (!uri) {
            reject(new TypeError('Must pass in a URI to "get"'));
            return;
        }
        const parsed = url_1.parse(uri);
        // Strip trailing `:`
        const protocol = (parsed.protocol || '').replace(/:$/, '');
        if (!protocol) {
            reject(new TypeError(`URI does not contain a protocol: ${uri}`));
            return;
        }
        const getter = getUri.protocols[protocol];
        if (typeof getter !== 'function') {
            throw new TypeError(`Unsupported protocol "${protocol}" specified in URI: ${uri}`);
        }
        resolve(getter(parsed, opts || {}));
    });
    if (typeof fn === 'function') {
        p.then(rtn => fn(null, rtn), err => fn(err));
    }
    else {
        return p;
    }
}
(function (getUri) {
    getUri.protocols = {
        data: data_1.default,
        file: file_1.default,
        ftp: ftp_1.default,
        http: http_1.default,
        https: https_1.default
    };
})(getUri || (getUri = {}));
module.exports = getUri;
//# sourceMappingURL=index.js.map