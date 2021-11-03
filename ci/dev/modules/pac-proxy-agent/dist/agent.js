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
const net_1 = __importDefault(require("net"));
const tls_1 = __importDefault(require("tls"));
const once_1 = __importDefault(require("@tootallnate/once"));
const crypto_1 = __importDefault(require("crypto"));
const get_uri_1 = __importDefault(require("get-uri"));
const debug_1 = __importDefault(require("debug"));
const raw_body_1 = __importDefault(require("raw-body"));
const url_1 = require("url");
const http_proxy_agent_1 = require("http-proxy-agent");
const https_proxy_agent_1 = require("https-proxy-agent");
const socks_proxy_agent_1 = require("socks-proxy-agent");
const pac_resolver_1 = __importDefault(require("pac-resolver"));
const agent_base_1 = require("agent-base");
const debug = debug_1.default('pac-proxy-agent');
/**
 * The `PacProxyAgent` class.
 *
 * A few different "protocol" modes are supported (supported protocols are
 * backed by the `get-uri` module):
 *
 *   - "pac+data", "data" - refers to an embedded "data:" URI
 *   - "pac+file", "file" - refers to a local file
 *   - "pac+ftp", "ftp" - refers to a file located on an FTP server
 *   - "pac+http", "http" - refers to an HTTP endpoint
 *   - "pac+https", "https" - refers to an HTTPS endpoint
 *
 * @api public
 */
class PacProxyAgent extends agent_base_1.Agent {
    constructor(uri, opts = {}) {
        super(opts);
        this.clearResolverPromise = () => {
            this.resolverPromise = undefined;
        };
        debug('Creating PacProxyAgent with URI %o and options %o', uri, opts);
        // Strip the "pac+" prefix
        this.uri = uri.replace(/^pac\+/i, '');
        this.opts = Object.assign({}, opts);
        this.cache = undefined;
        this.resolver = undefined;
        this.resolverHash = '';
        this.resolverPromise = undefined;
        // For `PacResolver`
        if (!this.opts.filename) {
            this.opts.filename = uri;
        }
    }
    /**
     * Loads the PAC proxy file from the source if necessary, and returns
     * a generated `FindProxyForURL()` resolver function to use.
     *
     * @api private
     */
    getResolver() {
        if (!this.resolverPromise) {
            this.resolverPromise = this.loadResolver();
            this.resolverPromise.then(this.clearResolverPromise, this.clearResolverPromise);
        }
        return this.resolverPromise;
    }
    loadResolver() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // (Re)load the contents of the PAC file URI
                const code = yield this.loadPacFile();
                // Create a sha1 hash of the JS code
                const hash = crypto_1.default
                    .createHash('sha1')
                    .update(code)
                    .digest('hex');
                if (this.resolver && this.resolverHash === hash) {
                    debug('Same sha1 hash for code - contents have not changed, reusing previous proxy resolver');
                    return this.resolver;
                }
                // Cache the resolver
                debug('Creating new proxy resolver instance');
                this.resolver = pac_resolver_1.default(code, this.opts);
                // Store that sha1 hash for future comparison purposes
                this.resolverHash = hash;
                return this.resolver;
            }
            catch (err) {
                if (this.resolver && err.code === 'ENOTMODIFIED') {
                    debug('Got ENOTMODIFIED response, reusing previous proxy resolver');
                    return this.resolver;
                }
                throw err;
            }
        });
    }
    /**
     * Loads the contents of the PAC proxy file.
     *
     * @api private
     */
    loadPacFile() {
        return __awaiter(this, void 0, void 0, function* () {
            debug('Loading PAC file: %o', this.uri);
            const rs = yield get_uri_1.default(this.uri, { cache: this.cache });
            debug('Got `Readable` instance for URI');
            this.cache = rs;
            const buf = yield raw_body_1.default(rs);
            debug('Read %o byte PAC file from URI', buf.length);
            return buf.toString('utf8');
        });
    }
    /**
     * Called when the node-core HTTP client library is creating a new HTTP request.
     *
     * @api protected
     */
    callback(req, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { secureEndpoint } = opts;
            // First, get a generated `FindProxyForURL()` function,
            // either cached or retrieved from the source
            const resolver = yield this.getResolver();
            // Calculate the `url` parameter
            const defaultPort = secureEndpoint ? 443 : 80;
            let path = req.path;
            let search = null;
            const firstQuestion = path.indexOf('?');
            if (firstQuestion !== -1) {
                search = path.substring(firstQuestion);
                path = path.substring(0, firstQuestion);
            }
            const urlOpts = Object.assign(Object.assign({}, opts), { protocol: secureEndpoint ? 'https:' : 'http:', pathname: path, search, 
                // need to use `hostname` instead of `host` otherwise `port` is ignored
                hostname: opts.host, host: null, href: null, 
                // set `port` to null when it is the protocol default port (80 / 443)
                port: defaultPort === opts.port ? null : opts.port });
            const url = url_1.format(urlOpts);
            debug('url: %o', url);
            let result = yield resolver(url);
            // Default to "DIRECT" if a falsey value was returned (or nothing)
            if (!result) {
                result = 'DIRECT';
            }
            const proxies = String(result)
                .trim()
                .split(/\s*;\s*/g)
                .filter(Boolean);
            if (this.opts.fallbackToDirect && !proxies.includes('DIRECT')) {
                proxies.push('DIRECT');
            }
            for (const proxy of proxies) {
                let agent = null;
                let socket = null;
                const [type, target] = proxy.split(/\s+/);
                debug('Attempting to use proxy: %o', proxy);
                if (type === 'DIRECT') {
                    // Direct connection to the destination endpoint
                    socket = secureEndpoint ? tls_1.default.connect(opts) : net_1.default.connect(opts);
                }
                else if (type === 'SOCKS' || type === 'SOCKS5') {
                    // Use a SOCKSv5h proxy
                    agent = new socks_proxy_agent_1.SocksProxyAgent(`socks://${target}`);
                }
                else if (type === 'SOCKS4') {
                    // Use a SOCKSv4a proxy
                    agent = new socks_proxy_agent_1.SocksProxyAgent(`socks4a://${target}`);
                }
                else if (type === 'PROXY' ||
                    type === 'HTTP' ||
                    type === 'HTTPS') {
                    // Use an HTTP or HTTPS proxy
                    // http://dev.chromium.org/developers/design-documents/secure-web-proxy
                    const proxyURL = `${type === 'HTTPS' ? 'https' : 'http'}://${target}`;
                    const proxyOpts = Object.assign(Object.assign({}, this.opts), url_1.parse(proxyURL));
                    if (secureEndpoint) {
                        agent = new https_proxy_agent_1.HttpsProxyAgent(proxyOpts);
                    }
                    else {
                        agent = new http_proxy_agent_1.HttpProxyAgent(proxyOpts);
                    }
                }
                try {
                    if (socket) {
                        // "DIRECT" connection, wait for connection confirmation
                        yield once_1.default(socket, 'connect');
                        req.emit('proxy', { proxy, socket });
                        return socket;
                    }
                    if (agent) {
                        const s = yield agent.callback(req, opts);
                        req.emit('proxy', { proxy, socket: s });
                        return s;
                    }
                    throw new Error(`Could not determine proxy type for: ${proxy}`);
                }
                catch (err) {
                    debug('Got error for proxy %o: %o', proxy, err);
                    req.emit('proxy', { proxy, error: err });
                }
            }
            throw new Error(`Failed to establish a socket connection to proxies: ${JSON.stringify(proxies)}`);
        });
    }
}
exports.default = PacProxyAgent;
//# sourceMappingURL=agent.js.map