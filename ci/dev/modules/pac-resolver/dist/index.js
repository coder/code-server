"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const url_1 = require("url");
const degenerator_1 = require("degenerator");
/**
 * Built-in PAC functions.
 */
const dateRange_1 = __importDefault(require("./dateRange"));
const dnsDomainIs_1 = __importDefault(require("./dnsDomainIs"));
const dnsDomainLevels_1 = __importDefault(require("./dnsDomainLevels"));
const dnsResolve_1 = __importDefault(require("./dnsResolve"));
const isInNet_1 = __importDefault(require("./isInNet"));
const isPlainHostName_1 = __importDefault(require("./isPlainHostName"));
const isResolvable_1 = __importDefault(require("./isResolvable"));
const localHostOrDomainIs_1 = __importDefault(require("./localHostOrDomainIs"));
const myIpAddress_1 = __importDefault(require("./myIpAddress"));
const shExpMatch_1 = __importDefault(require("./shExpMatch"));
const timeRange_1 = __importDefault(require("./timeRange"));
const weekdayRange_1 = __importDefault(require("./weekdayRange"));
/**
 * Returns an asynchronous `FindProxyForURL()` function
 * from the given JS string (from a PAC file).
 *
 * @param {String} str JS string
 * @param {Object} opts optional "options" object
 * @return {Function} async resolver function
 */
function createPacResolver(_str, _opts = {}) {
    const str = Buffer.isBuffer(_str) ? _str.toString('utf8') : _str;
    // The sandbox to use for the `vm` context.
    const sandbox = Object.assign(Object.assign({}, createPacResolver.sandbox), _opts.sandbox);
    const opts = Object.assign(Object.assign({ filename: 'proxy.pac' }, _opts), { sandbox });
    // Construct the array of async function names to add `await` calls to.
    const names = Object.keys(sandbox).filter((k) => isAsyncFunction(sandbox[k]));
    // Compile the JS `FindProxyForURL()` function into an async function.
    const resolver = degenerator_1.compile(str, 'FindProxyForURL', names, opts);
    function FindProxyForURL(url, _host, _callback) {
        let host = null;
        let callback = null;
        if (typeof _callback === 'function') {
            callback = _callback;
        }
        if (typeof _host === 'string') {
            host = _host;
        }
        else if (typeof _host === 'function') {
            callback = _host;
        }
        if (!host) {
            host = url_1.parse(url).hostname;
        }
        if (!host) {
            throw new TypeError('Could not determine `host`');
        }
        const promise = resolver(url, host);
        if (typeof callback === 'function') {
            toCallback(promise, callback);
        }
        else {
            return promise;
        }
    }
    Object.defineProperty(FindProxyForURL, 'toString', {
        value: () => resolver.toString(),
        enumerable: false,
    });
    return FindProxyForURL;
}
(function (createPacResolver) {
    createPacResolver.sandbox = Object.freeze({
        alert: (message = '') => console.log('%s', message),
        dateRange: dateRange_1.default,
        dnsDomainIs: dnsDomainIs_1.default,
        dnsDomainLevels: dnsDomainLevels_1.default,
        dnsResolve: dnsResolve_1.default,
        isInNet: isInNet_1.default,
        isPlainHostName: isPlainHostName_1.default,
        isResolvable: isResolvable_1.default,
        localHostOrDomainIs: localHostOrDomainIs_1.default,
        myIpAddress: myIpAddress_1.default,
        shExpMatch: shExpMatch_1.default,
        timeRange: timeRange_1.default,
        weekdayRange: weekdayRange_1.default,
    });
})(createPacResolver || (createPacResolver = {}));
function toCallback(promise, callback) {
    promise.then((rtn) => callback(null, rtn), callback);
}
function isAsyncFunction(v) {
    if (typeof v !== 'function')
        return false;
    // Native `AsyncFunction`
    if (v.constructor.name === 'AsyncFunction')
        return true;
    // TypeScript compiled
    if (String(v).indexOf('__awaiter(') !== -1)
        return true;
    // Legacy behavior - set `async` property on the function
    return Boolean(v.async);
}
module.exports = createPacResolver;
//# sourceMappingURL=index.js.map