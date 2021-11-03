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
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const file_uri_to_path_1 = __importDefault(require("file-uri-to-path"));
const notfound_1 = __importDefault(require("./notfound"));
const notmodified_1 = __importDefault(require("./notmodified"));
const debug = debug_1.default('get-uri:file');
/**
 * Returns a `fs.ReadStream` instance from a "file:" URI.
 */
function get({ href: uri }, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const { cache, flags = 'r', mode = 438 // =0666
         } = opts;
        try {
            // Convert URI → Path
            const filepath = file_uri_to_path_1.default(uri);
            debug('Normalized pathname: %o', filepath);
            // `open()` first to get a file descriptor and ensure that the file
            // exists.
            const fd = yield fs_extra_1.open(filepath, flags, mode);
            // Now `fstat()` to check the `mtime` and store the stat object for
            // the cache.
            const stat = yield fs_extra_1.fstat(fd);
            // if a `cache` was provided, check if the file has not been modified
            if (cache && cache.stat && stat && isNotModified(cache.stat, stat)) {
                throw new notmodified_1.default();
            }
            // `fs.ReadStream` takes care of calling `fs.close()` on the
            // fd after it's done reading
            // @ts-ignore - `@types/node` doesn't allow `null` as file path :/
            const rs = fs_1.createReadStream(null, Object.assign(Object.assign({ autoClose: true }, opts), { fd }));
            rs.stat = stat;
            return rs;
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                throw new notfound_1.default();
            }
            throw err;
        }
    });
}
exports.default = get;
// returns `true` if the `mtime` of the 2 stat objects are equal
function isNotModified(prev, curr) {
    return +prev.mtime === +curr.mtime;
}
//# sourceMappingURL=file.js.map