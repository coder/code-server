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
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const once_1 = __importDefault(require("@tootallnate/once"));
const debug_1 = __importDefault(require("debug"));
const url_1 = require("url");
const http_error_1 = __importDefault(require("./http-error"));
const notfound_1 = __importDefault(require("./notfound"));
const notmodified_1 = __importDefault(require("./notmodified"));
const debug = debug_1.default('get-uri:http');
/**
 * Returns a Readable stream from an "http:" URI.
 */
function get(parsed, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        debug('GET %o', parsed.href);
        const cache = getCache(parsed, opts.cache);
        // first check the previous Expires and/or Cache-Control headers
        // of a previous response if a `cache` was provided
        if (cache && isFresh(cache) && typeof cache.statusCode === 'number') {
            // check for a 3xx "redirect" status code on the previous cache
            const type = (cache.statusCode / 100) | 0;
            if (type === 3 && cache.headers.location) {
                debug('cached redirect');
                throw new Error('TODO: implement cached redirects!');
            }
            // otherwise we assume that it's the destination endpoint,
            // since there's nowhere else to redirect to
            throw new notmodified_1.default();
        }
        // 5 redirects allowed by default
        const maxRedirects = typeof opts.maxRedirects === 'number' ? opts.maxRedirects : 5;
        debug('allowing %o max redirects', maxRedirects);
        let mod;
        if (opts.http) {
            // the `https` module passed in from the "http.js" file
            mod = opts.http;
            debug('using secure `https` core module');
        }
        else {
            mod = http_1.default;
            debug('using `http` core module');
        }
        const options = Object.assign(Object.assign({}, opts), parsed);
        // add "cache validation" headers if a `cache` was provided
        if (cache) {
            if (!options.headers) {
                options.headers = {};
            }
            const lastModified = cache.headers['last-modified'];
            if (lastModified) {
                options.headers['If-Modified-Since'] = lastModified;
                debug('added "If-Modified-Since" request header: %o', lastModified);
            }
            const etag = cache.headers.etag;
            if (etag) {
                options.headers['If-None-Match'] = etag;
                debug('added "If-None-Match" request header: %o', etag);
            }
        }
        const req = mod.get(options);
        const res = yield once_1.default(req, 'response');
        const code = res.statusCode || 0;
        // assign a Date to this response for the "Cache-Control" delta calculation
        res.date = Date.now();
        res.parsed = parsed;
        debug('got %o response status code', code);
        // any 2xx response is a "success" code
        let type = (code / 100) | 0;
        // check for a 3xx "redirect" status code
        let location = res.headers.location;
        if (type === 3 && location) {
            if (!opts.redirects)
                opts.redirects = [];
            let redirects = opts.redirects;
            if (redirects.length < maxRedirects) {
                debug('got a "redirect" status code with Location: %o', location);
                // flush this response - we're not going to use it
                res.resume();
                // hang on to this Response object for the "redirects" Array
                redirects.push(res);
                let newUri = url_1.resolve(parsed.href, location);
                debug('resolved redirect URL: %o', newUri);
                let left = maxRedirects - redirects.length;
                debug('%o more redirects allowed after this one', left);
                // check if redirecting to a different protocol
                let parsedUrl = url_1.parse(newUri);
                if (parsedUrl.protocol !== parsed.protocol) {
                    opts.http = parsedUrl.protocol === 'https:' ? https_1.default : undefined;
                }
                return get(parsedUrl, opts);
            }
        }
        // if we didn't get a 2xx "success" status code, then create an Error object
        if (type !== 2) {
            res.resume();
            if (code === 304) {
                throw new notmodified_1.default();
            }
            else if (code === 404) {
                throw new notfound_1.default();
            }
            // other HTTP-level error
            throw new http_error_1.default(code);
        }
        if (opts.redirects) {
            // store a reference to the "redirects" Array on the Response object so that
            // they can be inspected during a subsequent call to GET the same URI
            res.redirects = opts.redirects;
        }
        return res;
    });
}
exports.default = get;
/**
 * Returns `true` if the provided cache's "freshness" is valid. That is, either
 * the Cache-Control header or Expires header values are still within the allowed
 * time period.
 *
 * @return {Boolean}
 * @api private
 */
function isFresh(cache) {
    let fresh = false;
    let expires = parseInt(cache.headers.expires || '', 10);
    const cacheControl = cache.headers['cache-control'];
    if (cacheControl) {
        // for Cache-Control rules, see: http://www.mnot.net/cache_docs/#CACHE-CONTROL
        debug('Cache-Control: %o', cacheControl);
        const parts = cacheControl.split(/,\s*?\b/);
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const subparts = part.split('=');
            const name = subparts[0];
            switch (name) {
                case 'max-age':
                    expires = (cache.date || 0) + parseInt(subparts[1], 10) * 1000;
                    fresh = Date.now() < expires;
                    if (fresh) {
                        debug('cache is "fresh" due to previous %o Cache-Control param', part);
                    }
                    return fresh;
                case 'must-revalidate':
                    // XXX: what we supposed to do here?
                    break;
                case 'no-cache':
                case 'no-store':
                    debug('cache is "stale" due to explicit %o Cache-Control param', name);
                    return false;
                default:
                    // ignore unknown cache value
                    break;
            }
        }
    }
    else if (expires) {
        // for Expires rules, see: http://www.mnot.net/cache_docs/#EXPIRES
        debug('Expires: %o', expires);
        fresh = Date.now() < expires;
        if (fresh) {
            debug('cache is "fresh" due to previous Expires response header');
        }
        return fresh;
    }
    return false;
}
/**
 * Attempts to return a previous Response object from a previous GET call to the
 * same URI.
 *
 * @api private
 */
function getCache(parsed, cache) {
    if (cache) {
        if (cache.parsed && cache.parsed.href === parsed.href) {
            return cache;
        }
        if (cache.redirects) {
            for (let i = 0; i < cache.redirects.length; i++) {
                const c = getCache(parsed, cache.redirects[i]);
                if (c) {
                    return c;
                }
            }
        }
    }
    return null;
}
//# sourceMappingURL=http.js.map