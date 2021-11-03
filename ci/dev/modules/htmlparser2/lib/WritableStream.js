"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Parser_1 = require("./Parser");
var stream_1 = require("stream");
var string_decoder_1 = require("string_decoder");
// Following the example in https://nodejs.org/api/stream.html#stream_decoding_buffers_in_a_writable_stream
function isBuffer(_chunk, encoding) {
    return encoding === "buffer";
}
/**
 * WritableStream makes the `Parser` interface available as a NodeJS stream.
 *
 * @see Parser
 */
var WritableStream = /** @class */ (function (_super) {
    __extends(WritableStream, _super);
    function WritableStream(cbs, options) {
        var _this = _super.call(this, { decodeStrings: false }) || this;
        _this._decoder = new string_decoder_1.StringDecoder();
        _this._parser = new Parser_1.Parser(cbs, options);
        return _this;
    }
    WritableStream.prototype._write = function (chunk, encoding, cb) {
        if (isBuffer(chunk, encoding))
            chunk = this._decoder.write(chunk);
        this._parser.write(chunk);
        cb();
    };
    WritableStream.prototype._final = function (cb) {
        this._parser.end(this._decoder.end());
        cb();
    };
    return WritableStream;
}(stream_1.Writable));
exports.WritableStream = WritableStream;
