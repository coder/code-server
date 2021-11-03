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
const once_1 = __importDefault(require("@tootallnate/once"));
const ftp_1 = __importDefault(require("ftp"));
const path_1 = require("path");
const debug_1 = __importDefault(require("debug"));
const notfound_1 = __importDefault(require("./notfound"));
const notmodified_1 = __importDefault(require("./notmodified"));
const debug = debug_1.default('get-uri:ftp');
/**
 * Returns a Readable stream from an "ftp:" URI.
 */
function get(parsed, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const { cache } = opts;
        const filepath = parsed.pathname;
        let lastModified = null;
        if (!filepath) {
            throw new TypeError('No "pathname"!');
        }
        const client = new ftp_1.default();
        client.once('greeting', (greeting) => {
            debug('FTP greeting: %o', greeting);
        });
        function onend() {
            // close the FTP client socket connection
            client.end();
        }
        try {
            opts.host = parsed.hostname || parsed.host || 'localhost';
            opts.port = parseInt(parsed.port || '0', 10) || 21;
            opts.debug = debug;
            if (parsed.auth) {
                const [user, password] = parsed.auth.split(':');
                opts.user = user;
                opts.password = password;
            }
            // await cb(_ => client.connect(opts, _));
            const readyPromise = once_1.default(client, 'ready');
            client.connect(opts);
            yield readyPromise;
            // first we have to figure out the Last Modified date.
            // try the MDTM command first, which is an optional extension command.
            try {
                lastModified = yield new Promise((resolve, reject) => {
                    client.lastMod(filepath, (err, res) => {
                        return err ? reject(err) : resolve(res);
                    });
                });
            }
            catch (err) {
                // handle the "file not found" error code
                if (err.code === 550) {
                    throw new notfound_1.default();
                }
            }
            if (!lastModified) {
                // Try to get the last modified date via the LIST command (uses
                // more bandwidth, but is more compatible with older FTP servers
                const list = yield new Promise((resolve, reject) => {
                    client.list(path_1.dirname(filepath), (err, res) => {
                        return err ? reject(err) : resolve(res);
                    });
                });
                // attempt to find the "entry" with a matching "name"
                const name = path_1.basename(filepath);
                const entry = list.find(e => e.name === name);
                if (entry) {
                    lastModified = entry.date;
                }
            }
            if (lastModified) {
                if (isNotModified()) {
                    throw new notmodified_1.default();
                }
            }
            else {
                throw new notfound_1.default();
            }
            // XXX: a small timeout seemed necessary otherwise FTP servers
            // were returning empty sockets for the file occasionally
            // setTimeout(client.get.bind(client, filepath, onfile), 10);
            const rs = (yield new Promise((resolve, reject) => {
                client.get(filepath, (err, res) => {
                    return err ? reject(err) : resolve(res);
                });
            }));
            rs.once('end', onend);
            rs.lastModified = lastModified;
            return rs;
        }
        catch (err) {
            client.destroy();
            throw err;
        }
        // called when `lastModified` is set, and a "cache" stream was provided
        function isNotModified() {
            if (cache && cache.lastModified && lastModified) {
                return +cache.lastModified === +lastModified;
            }
            return false;
        }
    });
}
exports.default = get;
//# sourceMappingURL=ftp.js.map