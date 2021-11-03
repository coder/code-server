"use strict";
// tslint:disable no-console
Object.defineProperty(exports, "__esModule", { value: true });
var Level;
(function (Level) {
    Level[Level["Trace"] = 0] = "Trace";
    Level[Level["Debug"] = 1] = "Debug";
    Level[Level["Info"] = 2] = "Info";
    Level[Level["Warning"] = 3] = "Warning";
    Level[Level["Error"] = 4] = "Error";
})(Level = exports.Level || (exports.Level = {}));
class Field {
    constructor(identifier, value) {
        this.identifier = identifier;
        this.value = value;
    }
    toJSON() {
        return {
            identifier: this.identifier,
            value: this.value,
        };
    }
}
exports.Field = Field;
class Time {
    constructor(expected, ms) {
        this.expected = expected;
        this.ms = ms;
    }
}
exports.Time = Time;
exports.time = (expected) => {
    return new Time(expected, Date.now());
};
exports.field = (name, value) => {
    return new Field(name, value);
};
/**
 * Format and build a *single* log entry at a time.
 */
class Formatter {
    /**
     * formatType is used for the strings returned from style() and reset().
     */
    constructor(formatType = "%s", colors = true) {
        this.formatType = formatType;
        this.colors = colors;
        this.format = "";
        this.args = [];
        this.fields = [];
        this.minimumTagWidth = 5;
    }
    /**
     * Add a tag.
     */
    tag(name, color) {
        for (let i = name.length; i < this.minimumTagWidth; ++i) {
            name += " ";
        }
        this.push(name + " ", color);
    }
    push(arg, color, weight) {
        if (Array.isArray(arg) && arg.every((a) => a instanceof Field)) {
            return void this.fields.push(...arg);
        }
        if (this.colors) {
            this.format += `${this.formatType}${this.getType(arg)}${this.formatType}`;
            this.args.push(this.style(color, weight), arg, this.reset());
        }
        else {
            this.format += `${this.getType(arg)}`;
            this.args.push(arg);
        }
    }
    /**
     * Write everything out and reset state.
     */
    write() {
        this.doWrite(...this.flush());
    }
    /**
     * Return current values and reset state.
     */
    flush() {
        const args = [this.format, this.args, this.fields];
        this.format = "";
        this.args = [];
        this.fields = [];
        return args;
    }
    /**
     * Get the format string for the value type.
     */
    getType(arg) {
        switch (typeof arg) {
            case "object": return "%o";
            case "number": return "%d";
            default: return "%s";
        }
    }
}
exports.Formatter = Formatter;
/**
 * Display logs in the browser using CSS in the output. Fields are displayed on
 * individual lines within a group.
 */
class BrowserFormatter extends Formatter {
    constructor() {
        super("%c");
    }
    style(color, weight) {
        return (color ? `color: ${color};` : "")
            + (weight ? `font-weight: ${weight};` : "");
    }
    reset() {
        return this.style("inherit", "normal");
    }
    doWrite(format, args, fields) {
        console.groupCollapsed(format, ...args);
        fields.forEach((field) => {
            this.push(field.identifier, "#3794ff", "bold");
            if (typeof field.value !== "undefined" && field.value.constructor && field.value.constructor.name) {
                this.push(` (${field.value.constructor.name})`);
            }
            this.push(": ");
            this.push(field.value);
            const flushed = this.flush();
            console.log(flushed[0], ...flushed[1]);
        });
        console.groupEnd();
    }
}
exports.BrowserFormatter = BrowserFormatter;
/**
 * Display logs on the command line using ANSI color codes. Fields are displayed
 * in a single stringified object inline.
 */
class ServerFormatter extends Formatter {
    constructor() {
        super("%s", !!process.stdout.isTTY);
    }
    style(color, weight) {
        return (weight === "bold" ? "\u001B[1m" : "")
            + (color ? this.hex(color) : "");
    }
    reset() {
        return "\u001B[0m";
    }
    hex(hex) {
        const [r, g, b] = this.hexToRgb(hex);
        return `\u001B[38;2;${r};${g};${b}m`;
    }
    hexToRgb(hex) {
        const integer = parseInt(hex.substr(1), 16);
        return [
            (integer >> 16) & 0xFF,
            (integer >> 8) & 0xFF,
            integer & 0xFF,
        ];
    }
    doWrite(format, args, fields) {
        if (fields.length === 0) {
            return console.log("[%s] " + format, new Date().toISOString(), ...args);
        }
        const obj = {};
        fields.forEach((field) => obj[field.identifier] = field.value);
        console.log("[%s] " + format + " %s%s%s", new Date().toISOString(), ...args, this.style("#8c8c8c"), JSON.stringify(obj), this.reset());
    }
}
exports.ServerFormatter = ServerFormatter;
class Logger {
    constructor(_formatter, name, defaultFields, extenders = []) {
        this._formatter = _formatter;
        this.name = name;
        this.defaultFields = defaultFields;
        this.extenders = extenders;
        this.level = Level.Info;
        this.muted = false;
        if (name) {
            this.nameColor = this.hashStringToColor(name);
        }
        if (typeof process !== "undefined" && typeof process.env !== "undefined") {
            switch (process.env.LOG_LEVEL) {
                case "trace":
                    this.level = Level.Trace;
                    break;
                case "debug":
                    this.level = Level.Debug;
                    break;
                case "info":
                    this.level = Level.Info;
                    break;
                case "warn":
                    this.level = Level.Warning;
                    break;
                case "error":
                    this.level = Level.Error;
                    break;
            }
        }
    }
    set formatter(formatter) {
        this._formatter = formatter;
    }
    /**
     * Supresses all output
     */
    mute() {
        this.muted = true;
    }
    extend(extender) {
        this.extenders.push(extender);
    }
    info(message, ...fields) {
        this.handle({
            type: "info",
            message,
            fields,
            tagColor: "#008FBF",
            level: Level.Info,
        });
    }
    warn(message, ...fields) {
        this.handle({
            type: "warn",
            message,
            fields,
            tagColor: "#FF9D00",
            level: Level.Warning,
        });
    }
    trace(message, ...fields) {
        this.handle({
            type: "trace",
            message,
            fields,
            tagColor: "#888888",
            level: Level.Trace,
        });
    }
    debug(message, ...fields) {
        this.handle({
            type: "debug",
            message,
            fields,
            tagColor: "#84009E",
            level: Level.Debug,
        });
    }
    error(message, ...fields) {
        this.handle({
            type: "error",
            message,
            fields,
            tagColor: "#B00000",
            level: Level.Error,
        });
    }
    /**
     * Returns a sub-logger with a name.
     * Each name is deterministically generated a color.
     */
    named(name, ...fields) {
        const l = new Logger(this._formatter, name, fields, this.extenders);
        if (this.muted) {
            l.mute();
        }
        return l;
    }
    handle(options) {
        if (this.level > options.level || this.muted) {
            return;
        }
        let passedFields = options.fields || [];
        if (typeof options.message === "function") {
            const values = options.message();
            options.message = values.shift();
            passedFields = values;
        }
        const fields = (this.defaultFields
            ? passedFields.filter((f) => !!f).concat(this.defaultFields)
            : passedFields.filter((f) => !!f));
        const now = Date.now();
        let times = [];
        const hasFields = fields && fields.length > 0;
        if (hasFields) {
            times = fields.filter((f) => f.value instanceof Time);
            this._formatter.push(fields);
        }
        this._formatter.tag(options.type, options.tagColor);
        if (this.name && this.nameColor) {
            this._formatter.tag(this.name, this.nameColor);
        }
        this._formatter.push(options.message);
        if (times.length > 0) {
            times.forEach((time) => {
                const diff = now - time.value.ms;
                const expPer = diff / time.value.expected;
                const min = 125 * (1 - expPer);
                const max = 125 + min;
                const green = expPer < 1 ? max : min;
                const red = expPer >= 1 ? max : min;
                this._formatter.push(` ${time.identifier}=`, "#3794ff");
                this._formatter.push(`${diff}ms`, this.rgbToHex(red > 0 ? red : 0, green > 0 ? green : 0, 0));
            });
        }
        this._formatter.write();
        this.extenders.forEach((extender) => {
            extender({
                section: this.name,
                fields: options.fields,
                level: options.level,
                message: options.message,
                type: options.type,
            });
        });
    }
    /**
     * Hashes a string.
     */
    djb2(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
        }
        return hash;
    }
    rgbToHex(r, g, b) {
        const integer = ((Math.round(r) & 0xFF) << 16)
            + ((Math.round(g) & 0xFF) << 8)
            + (Math.round(b) & 0xFF);
        const str = integer.toString(16);
        return "#" + "000000".substring(str.length) + str;
    }
    /**
     * Generates a deterministic color from a string using hashing.
     */
    hashStringToColor(str) {
        const hash = this.djb2(str);
        return this.rgbToHex((hash & 0xFF0000) >> 16, (hash & 0x00FF00) >> 8, hash & 0x0000FF);
    }
}
exports.Logger = Logger;
exports.logger = new Logger(typeof process === "undefined" || typeof process.stdout === "undefined"
    ? new BrowserFormatter()
    : new ServerFormatter());
//# sourceMappingURL=logger.js.map