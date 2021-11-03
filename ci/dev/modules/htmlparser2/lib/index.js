"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Parser_1 = require("./Parser");
exports.Parser = Parser_1.Parser;
var domhandler_1 = require("domhandler");
exports.DomHandler = domhandler_1.DomHandler;
exports.DefaultHandler = domhandler_1.DomHandler;
// Helper methods
/**
 * Parses data, returns the resulting DOM.
 *
 * @param data The data that should be parsed.
 * @param options Optional options for the parser and DOM builder.
 */
function parseDOM(data, options) {
    var handler = new domhandler_1.DomHandler(void 0, options);
    new Parser_1.Parser(handler, options).end(data);
    return handler.dom;
}
exports.parseDOM = parseDOM;
/**
 * Creates a parser instance, with an attached DOM handler.
 *
 * @param cb A callback that will be called once parsing has been completed.
 * @param options Optional options for the parser and DOM builder.
 * @param elementCb An optional callback that will be called every time a tag has been completed inside of the DOM.
 */
function createDomStream(cb, options, elementCb) {
    var handler = new domhandler_1.DomHandler(cb, options, elementCb);
    return new Parser_1.Parser(handler, options);
}
exports.createDomStream = createDomStream;
var Tokenizer_1 = require("./Tokenizer");
exports.Tokenizer = Tokenizer_1.default;
var ElementType = __importStar(require("domelementtype"));
exports.ElementType = ElementType;
/**
 * List of all events that the parser emits.
 *
 * Format: eventname: number of arguments.
 */
exports.EVENTS = {
    attribute: 2,
    cdatastart: 0,
    cdataend: 0,
    text: 1,
    processinginstruction: 2,
    comment: 1,
    commentend: 0,
    closetag: 1,
    opentag: 2,
    opentagname: 1,
    error: 1,
    end: 0
};
/*
    All of the following exports exist for backwards-compatibility.
    They should probably be removed eventually.
*/
__export(require("./FeedHandler"));
__export(require("./WritableStream"));
__export(require("./CollectingHandler"));
var DomUtils = __importStar(require("domutils"));
exports.DomUtils = DomUtils;
var FeedHandler_1 = require("./FeedHandler");
exports.RssHandler = FeedHandler_1.FeedHandler;
