"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const get_uri_1 = __importDefault(require("get-uri"));
const url_1 = require("url");
const agent_1 = __importDefault(require("./agent"));
function createPacProxyAgent(uri, opts) {
    // was an options object passed in first?
    if (typeof uri === 'object') {
        opts = uri;
        // result of a url.parse() call?
        if (opts.href) {
            if (opts.path && !opts.pathname) {
                opts.pathname = opts.path;
            }
            opts.slashes = true;
            uri = url_1.format(opts);
        }
        else {
            uri = opts.uri;
        }
    }
    if (!opts) {
        opts = {};
    }
    if (typeof uri !== 'string') {
        throw new TypeError('a PAC file URI must be specified!');
    }
    return new agent_1.default(uri, opts);
}
(function (createPacProxyAgent) {
    createPacProxyAgent.PacProxyAgent = agent_1.default;
    /**
     * Supported "protocols". Delegates out to the `get-uri` module.
     */
    createPacProxyAgent.protocols = Object.keys(get_uri_1.default.protocols);
    createPacProxyAgent.prototype = agent_1.default.prototype;
})(createPacProxyAgent || (createPacProxyAgent = {}));
module.exports = createPacProxyAgent;
//# sourceMappingURL=index.js.map