"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStream = exports.RotatingFileStream = void 0;
const child_process_1 = require("child_process");
const zlib_1 = require("zlib");
const stream_1 = require("stream");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const timers_1 = require("timers");
class RotatingFileStreamError extends Error {
    constructor() {
        super("Too many destination file attempts");
        this.code = "RFS-TOO-MANY";
    }
}
class RotatingFileStream extends stream_1.Writable {
    constructor(generator, options) {
        const { encoding, history, maxFiles, maxSize, path } = options;
        super({ decodeStrings: true, defaultEncoding: encoding });
        this.createGzip = zlib_1.createGzip;
        this.exec = child_process_1.exec;
        this.filename = path + generator(null);
        this.fsClose = fs_1.close;
        this.fsCreateReadStream = fs_1.createReadStream;
        this.fsCreateWriteStream = fs_1.createWriteStream;
        this.fsMkdir = fs_1.mkdir;
        this.fsOpen = fs_1.open;
        this.fsReadFile = fs_1.readFile;
        this.fsRename = fs_1.rename;
        this.fsStat = fs_1.stat;
        this.fsUnlink = fs_1.unlink;
        this.fsWrite = fs_1.write;
        this.fsWriteFile = fs_1.writeFile;
        this.generator = generator;
        this.maxTimeout = 2147483640;
        this.options = options;
        if (maxFiles || maxSize)
            options.history = path + (history ? history : this.generator(null) + ".txt");
        this.on("close", () => (this.finished ? null : this.emit("finish")));
        this.on("finish", () => (this.finished = this.clear()));
        process.nextTick(() => this.init(error => {
            this.error = error;
            if (this.opened)
                this.opened();
            else if (this.error)
                this.emit("error", error);
        }));
    }
    _destroy(error, callback) {
        const destroyer = () => {
            this.clear();
            this.reclose(() => { });
        };
        if (this.stream)
            destroyer();
        else
            this.destroyer = destroyer;
        callback(error);
    }
    _final(callback) {
        if (this.stream)
            return this.stream.end(callback);
        callback();
    }
    _write(chunk, encoding, callback) {
        this.rewrite([{ chunk, encoding }], 0, callback);
    }
    _writev(chunks, callback) {
        this.rewrite(chunks, 0, callback);
    }
    rewrite(chunks, index, callback) {
        const destroy = (error) => {
            this.destroy();
            return callback(error);
        };
        const rewrite = () => {
            if (this.destroyed)
                return callback(this.error);
            if (this.error)
                return destroy(this.error);
            if (!this.stream) {
                this.opened = rewrite;
                return;
            }
            const done = (error) => {
                if (error)
                    return destroy(error);
                if (++index !== chunks.length)
                    return this.rewrite(chunks, index, callback);
                callback();
            };
            this.size += chunks[index].chunk.length;
            this.stream.write(chunks[index].chunk, chunks[index].encoding, (error) => {
                if (error)
                    return done(error);
                if (this.options.size && this.size >= this.options.size)
                    return this.rotate(done);
                done();
            });
            if (this.options.teeToStdout && !process.stdout.destroyed)
                this.writeToStdOut(chunks[index].chunk, chunks[index].encoding);
        };
        if (this.stream) {
            return this.fsStat(this.filename, (error) => {
                if (!error)
                    return rewrite();
                if (error.code !== "ENOENT")
                    return destroy(error);
                this.reclose(() => this.reopen(false, 0, () => rewrite()));
            });
        }
        this.opened = rewrite;
    }
    writeToStdOut(buffer, encoding) {
        process.stdout.write(buffer, encoding);
    }
    init(callback) {
        const { immutable, initialRotation, interval, size } = this.options;
        if (immutable)
            return this.immutate(true, callback);
        this.fsStat(this.filename, (error, stats) => {
            if (error)
                return error.code === "ENOENT" ? this.reopen(false, 0, callback) : callback(error);
            if (!stats.isFile())
                return callback(new Error(`Can't write on: ${this.filename} (it is not a file)`));
            if (initialRotation) {
                this.intervalBounds(this.now());
                const prev = this.prev;
                this.intervalBounds(new Date(stats.mtime.getTime()));
                if (prev !== this.prev)
                    return this.rotate(callback);
            }
            this.size = stats.size;
            if (!size || stats.size < size)
                return this.reopen(false, stats.size, callback);
            if (interval)
                this.intervalBounds(this.now());
            this.rotate(callback);
        });
    }
    makePath(name, callback) {
        const dir = path_1.parse(name).dir;
        this.fsMkdir(dir, (error) => {
            if (error) {
                if (error.code === "ENOENT")
                    return this.makePath(dir, (error) => (error ? callback(error) : this.makePath(name, callback)));
                if (error.code === "EEXIST")
                    return callback();
                return callback(error);
            }
            callback();
        });
    }
    reopen(retry, size, callback) {
        const options = { flags: "a" };
        if ("mode" in this.options)
            options.mode = this.options.mode;
        let called;
        const stream = this.fsCreateWriteStream(this.filename, options);
        const end = (error) => {
            if (called) {
                this.error = error;
                return;
            }
            called = true;
            this.stream = stream;
            if (this.opened) {
                process.nextTick(this.opened);
                this.opened = null;
            }
            if (this.destroyer)
                process.nextTick(this.destroyer);
            callback(error);
        };
        stream.once("open", () => {
            this.size = size;
            end();
            this.interval();
            this.emit("open", this.filename);
        });
        stream.once("error", (error) => error.code !== "ENOENT" || retry ? end(error) : this.makePath(this.filename, (error) => (error ? end(error) : this.reopen(true, size, callback))));
    }
    reclose(callback) {
        const { stream } = this;
        if (!stream)
            return callback();
        this.stream = null;
        stream.once("finish", callback);
        stream.end();
    }
    now() {
        return new Date();
    }
    rotate(callback) {
        const { immutable, rotate } = this.options;
        this.size = 0;
        this.rotation = this.now();
        this.clear();
        this.reclose(() => (rotate ? this.classical(rotate, callback) : immutable ? this.immutate(false, callback) : this.move(callback)));
        this.emit("rotation");
    }
    findName(tmp, callback, index) {
        if (!index)
            index = 1;
        const { interval, path, intervalBoundary } = this.options;
        let filename = `${this.filename}.${index}.rfs.tmp`;
        if (index >= 1000)
            return callback(new RotatingFileStreamError());
        if (!tmp) {
            try {
                filename = path + this.generator(interval && intervalBoundary ? new Date(this.prev) : this.rotation, index);
            }
            catch (e) {
                return callback(e);
            }
        }
        this.fsStat(filename, error => {
            if (!error || error.code !== "ENOENT")
                return this.findName(tmp, callback, index + 1);
            callback(null, filename);
        });
    }
    move(callback) {
        const { compress } = this.options;
        let filename;
        const open = (error) => {
            if (error)
                return callback(error);
            this.rotated(filename, callback);
        };
        this.findName(false, (error, found) => {
            if (error)
                return callback(error);
            filename = found;
            this.touch(filename, false, (error) => {
                if (error)
                    return callback(error);
                if (compress)
                    return this.compress(filename, open);
                this.fsRename(this.filename, filename, open);
            });
        });
    }
    touch(filename, retry, callback) {
        this.fsOpen(filename, "a", parseInt("666", 8), (error, fd) => {
            if (error) {
                if (error.code !== "ENOENT" || retry)
                    return callback(error);
                return this.makePath(filename, error => {
                    if (error)
                        return callback(error);
                    this.touch(filename, true, callback);
                });
            }
            return this.fsClose(fd, (error) => {
                if (error)
                    return callback(error);
                this.fsUnlink(filename, (error) => {
                    if (error)
                        this.emit("warning", error);
                    callback();
                });
            });
        });
    }
    classical(count, callback) {
        const { compress, path, rotate } = this.options;
        let prevName;
        let thisName;
        if (rotate === count)
            delete this.rotatedName;
        const open = (error) => {
            if (error)
                return callback(error);
            this.rotated(this.rotatedName, callback);
        };
        try {
            prevName = count === 1 ? this.filename : path + this.generator(count - 1);
            thisName = path + this.generator(count);
        }
        catch (e) {
            return callback(e);
        }
        const next = count === 1 ? open : () => this.classical(count - 1, callback);
        const move = () => {
            if (count === 1 && compress)
                return this.compress(thisName, open);
            this.fsRename(prevName, thisName, (error) => {
                if (!error)
                    return next();
                if (error.code !== "ENOENT")
                    return callback(error);
                this.makePath(thisName, (error) => {
                    if (error)
                        return callback(error);
                    this.fsRename(prevName, thisName, (error) => (error ? callback(error) : next()));
                });
            });
        };
        this.fsStat(prevName, (error) => {
            if (error) {
                if (error.code !== "ENOENT")
                    return callback(error);
                return next();
            }
            if (!this.rotatedName)
                this.rotatedName = thisName;
            move();
        });
    }
    clear() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        return true;
    }
    intervalBoundsBig(now) {
        const year = now.getFullYear();
        let month = now.getMonth();
        let day = now.getDate();
        let hours = now.getHours();
        const { num, unit } = this.options.interval;
        if (unit === "M") {
            day = 1;
            hours = 0;
        }
        else if (unit === "d")
            hours = 0;
        else
            hours = parseInt((hours / num), 10) * num;
        this.prev = new Date(year, month, day, hours, 0, 0, 0).getTime();
        if (unit === "M")
            month += num;
        else if (unit === "d")
            day += num;
        else
            hours += num;
        this.next = new Date(year, month, day, hours, 0, 0, 0).getTime();
    }
    intervalBounds(now) {
        const unit = this.options.interval.unit;
        if (unit === "M" || unit === "d" || unit === "h")
            this.intervalBoundsBig(now);
        else {
            let period = 1000 * this.options.interval.num;
            if (unit === "m")
                period *= 60;
            this.prev = parseInt((now.getTime() / period), 10) * period;
            this.next = this.prev + period;
        }
        return new Date(this.prev);
    }
    interval() {
        if (!this.options.interval)
            return;
        this.intervalBounds(this.now());
        const set = () => {
            const time = this.next - this.now().getTime();
            if (time <= 0)
                return this.rotate(error => (this.error = error));
            this.timer = timers_1.setTimeout(set, time > this.maxTimeout ? this.maxTimeout : time);
            this.timer.unref();
        };
        set();
    }
    compress(filename, callback) {
        const { compress } = this.options;
        const done = (error) => {
            if (error)
                return callback(error);
            this.fsUnlink(this.filename, callback);
        };
        if (typeof compress === "function")
            this.external(filename, done);
        else
            this.gzip(filename, done);
    }
    external(filename, callback) {
        const compress = this.options.compress;
        let cont;
        try {
            cont = compress(this.filename, filename);
        }
        catch (e) {
            return callback(e);
        }
        this.findName(true, (error, found) => {
            if (error)
                return callback(error);
            this.fsOpen(found, "w", 0o777, (error, fd) => {
                if (error)
                    return callback(error);
                const unlink = (error) => {
                    this.fsUnlink(found, (error2) => {
                        if (error2)
                            this.emit("warning", error2);
                        callback(error);
                    });
                };
                this.fsWrite(fd, cont, "utf8", (error) => {
                    this.fsClose(fd, (error2) => {
                        if (error) {
                            if (error2)
                                this.emit("warning", error2);
                            return unlink(error);
                        }
                        if (error2)
                            return unlink(error2);
                        if (found.indexOf(path_1.sep) === -1)
                            found = `.${path_1.sep}${found}`;
                        this.exec(`sh "${found}"`, unlink);
                    });
                });
            });
        });
    }
    gzip(filename, callback) {
        const { mode } = this.options;
        const options = mode ? { mode } : {};
        const inp = this.fsCreateReadStream(this.filename, {});
        const out = this.fsCreateWriteStream(filename, options);
        const zip = this.createGzip();
        [inp, out, zip].map(stream => stream.once("error", callback));
        out.once("finish", callback);
        inp.pipe(zip).pipe(out);
    }
    rotated(filename, callback) {
        const { maxFiles, maxSize } = this.options;
        const open = (error) => {
            if (error)
                return callback(error);
            this.reopen(false, 0, callback);
            this.emit("rotated", filename);
        };
        if (maxFiles || maxSize)
            return this.history(filename, open);
        open();
    }
    history(filename, callback) {
        const { history } = this.options;
        this.fsReadFile(history, "utf8", (error, data) => {
            if (error) {
                if (error.code !== "ENOENT")
                    return callback(error);
                return this.historyGather([filename], 0, [], callback);
            }
            const files = data.split("\n");
            files.push(filename);
            this.historyGather(files, 0, [], callback);
        });
    }
    historyGather(files, index, res, callback) {
        if (index === files.length)
            return this.historyCheckFiles(res, callback);
        this.fsStat(files[index], (error, stats) => {
            if (error) {
                if (error.code !== "ENOENT")
                    return callback(error);
            }
            else if (stats.isFile()) {
                res.push({
                    name: files[index],
                    size: stats.size,
                    time: stats.ctime.getTime()
                });
            }
            else
                this.emit("warning", new Error(`File '${files[index]}' contained in history is not a regular file`));
            this.historyGather(files, index + 1, res, callback);
        });
    }
    historyRemove(files, size, callback) {
        const file = files.shift();
        this.fsUnlink(file.name, (error) => {
            if (error)
                return callback(error);
            this.emit("removed", file.name, !size);
            callback();
        });
    }
    historyCheckFiles(files, callback) {
        const { maxFiles } = this.options;
        files.sort((a, b) => a.time - b.time);
        if (!maxFiles || files.length <= maxFiles)
            return this.historyCheckSize(files, callback);
        this.historyRemove(files, false, (error) => (error ? callback(error) : this.historyCheckFiles(files, callback)));
    }
    historyCheckSize(files, callback) {
        const { maxSize } = this.options;
        let size = 0;
        if (!maxSize)
            return this.historyWrite(files, callback);
        files.map(e => (size += e.size));
        if (size <= maxSize)
            return this.historyWrite(files, callback);
        this.historyRemove(files, true, (error) => (error ? callback(error) : this.historyCheckSize(files, callback)));
    }
    historyWrite(files, callback) {
        this.fsWriteFile(this.options.history, files.map(e => e.name).join("\n") + "\n", "utf8", (error) => {
            if (error)
                return callback(error);
            this.emit("history");
            callback();
        });
    }
    immutate(first, callback, index, now) {
        if (!index) {
            index = 1;
            now = this.now();
        }
        if (index >= 1001)
            return callback(new RotatingFileStreamError());
        try {
            this.filename = this.options.path + this.generator(now, index);
        }
        catch (e) {
            return callback(e);
        }
        const open = (size, callback) => {
            if (first) {
                this.last = this.filename;
                return this.reopen(false, size, callback);
            }
            this.rotated(this.last, (error) => {
                this.last = this.filename;
                callback(error);
            });
        };
        this.fsStat(this.filename, (error, stats) => {
            const { size } = this.options;
            if (error) {
                if (error.code === "ENOENT")
                    return open(0, callback);
                return callback(error);
            }
            if (!stats.isFile())
                return callback(new Error(`Can't write on: '${this.filename}' (it is not a file)`));
            if (size && stats.size >= size)
                return this.immutate(first, callback, index + 1, now);
            open(stats.size, callback);
        });
    }
}
exports.RotatingFileStream = RotatingFileStream;
function buildNumberCheck(field) {
    return (type, options, value) => {
        const converted = parseInt(value, 10);
        if (type !== "number" || converted !== value || converted <= 0)
            throw new Error(`'${field}' option must be a positive integer number`);
    };
}
function buildStringCheck(field, check) {
    return (type, options, value) => {
        if (type !== "string")
            throw new Error(`Don't know how to handle 'options.${field}' type: ${type}`);
        options[field] = check(value);
    };
}
function checkMeasure(value, what, units) {
    const ret = {};
    ret.num = parseInt(value, 10);
    if (isNaN(ret.num))
        throw new Error(`Unknown 'options.${what}' format: ${value}`);
    if (ret.num <= 0)
        throw new Error(`A positive integer number is expected for 'options.${what}'`);
    ret.unit = value.replace(/^[ 0]*/g, "").substr((ret.num + "").length, 1);
    if (ret.unit.length === 0)
        throw new Error(`Missing unit for 'options.${what}'`);
    if (!units[ret.unit])
        throw new Error(`Unknown 'options.${what}' unit: ${ret.unit}`);
    return ret;
}
const intervalUnits = {
    M: true,
    d: true,
    h: true,
    m: true,
    s: true
};
function checkIntervalUnit(ret, unit, amount) {
    if (parseInt((amount / ret.num), 10) * ret.num !== amount)
        throw new Error(`An integer divider of ${amount} is expected as ${unit} for 'options.interval'`);
}
function checkInterval(value) {
    const ret = checkMeasure(value, "interval", intervalUnits);
    switch (ret.unit) {
        case "h":
            checkIntervalUnit(ret, "hours", 24);
            break;
        case "m":
            checkIntervalUnit(ret, "minutes", 60);
            break;
        case "s":
            checkIntervalUnit(ret, "seconds", 60);
            break;
    }
    return ret;
}
const sizeUnits = {
    B: true,
    G: true,
    K: true,
    M: true
};
function checkSize(value) {
    const ret = checkMeasure(value, "size", sizeUnits);
    if (ret.unit === "K")
        return ret.num * 1024;
    if (ret.unit === "M")
        return ret.num * 1048576;
    if (ret.unit === "G")
        return ret.num * 1073741824;
    return ret.num;
}
const checks = {
    compress: (type, options, value) => {
        if (!value)
            throw new Error("A value for 'options.compress' must be specified");
        if (type === "boolean")
            return (options.compress = (source, dest) => `cat ${source} | gzip -c9 > ${dest}`);
        if (type === "function")
            return;
        if (type !== "string")
            throw new Error(`Don't know how to handle 'options.compress' type: ${type}`);
        if (value !== "gzip")
            throw new Error(`Don't know how to handle compression method: ${value}`);
    },
    encoding: (type, options, value) => new util_1.TextDecoder(value),
    history: (type) => {
        if (type !== "string")
            throw new Error(`Don't know how to handle 'options.history' type: ${type}`);
    },
    immutable: () => { },
    initialRotation: () => { },
    interval: buildStringCheck("interval", checkInterval),
    intervalBoundary: () => { },
    maxFiles: buildNumberCheck("maxFiles"),
    maxSize: buildStringCheck("maxSize", checkSize),
    mode: () => { },
    path: (type, options, value) => {
        if (type !== "string")
            throw new Error(`Don't know how to handle 'options.path' type: ${type}`);
        if (value[value.length - 1] !== path_1.sep)
            options.path = value + path_1.sep;
    },
    rotate: buildNumberCheck("rotate"),
    size: buildStringCheck("size", checkSize),
    teeToStdout: () => { }
};
function checkOpts(options) {
    const ret = {};
    for (const opt in options) {
        const value = options[opt];
        const type = typeof value;
        if (!(opt in checks))
            throw new Error(`Unknown option: ${opt}`);
        ret[opt] = options[opt];
        checks[opt](type, ret, value);
    }
    if (!ret.path)
        ret.path = "";
    if (!ret.interval) {
        delete ret.immutable;
        delete ret.initialRotation;
        delete ret.intervalBoundary;
    }
    if (ret.rotate) {
        delete ret.history;
        delete ret.immutable;
        delete ret.maxFiles;
        delete ret.maxSize;
        delete ret.intervalBoundary;
    }
    if (ret.immutable)
        delete ret.compress;
    if (!ret.intervalBoundary)
        delete ret.initialRotation;
    return ret;
}
function createClassical(filename) {
    return (index) => (index ? `${filename}.${index}` : filename);
}
function createGenerator(filename) {
    const pad = (num) => (num > 9 ? "" : "0") + num;
    return (time, index) => {
        if (!time)
            return filename;
        const month = time.getFullYear() + "" + pad(time.getMonth() + 1);
        const day = pad(time.getDate());
        const hour = pad(time.getHours());
        const minute = pad(time.getMinutes());
        return month + day + "-" + hour + minute + "-" + pad(index) + "-" + filename;
    };
}
function createStream(filename, options) {
    if (typeof options === "undefined")
        options = {};
    else if (typeof options !== "object")
        throw new Error(`The "options" argument must be of type object. Received type ${typeof options}`);
    const opts = checkOpts(options);
    let generator;
    if (typeof filename === "string")
        generator = options.rotate ? createClassical(filename) : createGenerator(filename);
    else if (typeof filename === "function")
        generator = filename;
    else
        throw new Error(`The "filename" argument must be one of type string or function. Received type ${typeof filename}`);
    return new RotatingFileStream(generator, opts);
}
exports.createStream = createStream;
