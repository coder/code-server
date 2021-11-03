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
const debug_1 = __importDefault(require("debug"));
const stream_1 = require("stream");
const crypto_1 = require("crypto");
const data_uri_to_buffer_1 = __importDefault(require("data-uri-to-buffer"));
const notmodified_1 = __importDefault(require("./notmodified"));
const debug = debug_1.default('get-uri:data');
class DataReadable extends stream_1.Readable {
    constructor(hash, buf) {
        super();
        this.push(buf);
        this.push(null);
        this.hash = hash;
    }
}
/**
 * Returns a Readable stream from a "data:" URI.
 */
function get({ href: uri }, { cache }) {
    return __awaiter(this, void 0, void 0, function* () {
        // need to create a SHA1 hash of the URI string, for cacheability checks
        // in future `getUri()` calls with the same data URI passed in.
        const shasum = crypto_1.createHash('sha1');
        shasum.update(uri);
        const hash = shasum.digest('hex');
        debug('generated SHA1 hash for "data:" URI: %o', hash);
        // check if the cache is the same "data:" URI that was previously passed in.
        if (cache && cache.hash === hash) {
            debug('got matching cache SHA1 hash: %o', hash);
            throw new notmodified_1.default();
        }
        else {
            debug('creating Readable stream from "data:" URI buffer');
            const buf = data_uri_to_buffer_1.default(uri);
            return new DataReadable(hash, buf);
        }
    });
}
exports.default = get;
//# sourceMappingURL=data.js.map