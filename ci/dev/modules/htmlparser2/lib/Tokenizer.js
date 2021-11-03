"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var decode_codepoint_1 = __importDefault(require("entities/lib/decode_codepoint"));
var entities_json_1 = __importDefault(require("entities/lib/maps/entities.json"));
var legacy_json_1 = __importDefault(require("entities/lib/maps/legacy.json"));
var xml_json_1 = __importDefault(require("entities/lib/maps/xml.json"));
function whitespace(c) {
    return c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r";
}
function ifElseState(upper, SUCCESS, FAILURE) {
    var lower = upper.toLowerCase();
    if (upper === lower) {
        return function (t, c) {
            if (c === lower) {
                t._state = SUCCESS;
            }
            else {
                t._state = FAILURE;
                t._index--;
            }
        };
    }
    else {
        return function (t, c) {
            if (c === lower || c === upper) {
                t._state = SUCCESS;
            }
            else {
                t._state = FAILURE;
                t._index--;
            }
        };
    }
}
function consumeSpecialNameChar(upper, NEXT_STATE) {
    var lower = upper.toLowerCase();
    return function (t, c) {
        if (c === lower || c === upper) {
            t._state = NEXT_STATE;
        }
        else {
            t._state = 3 /* InTagName */;
            t._index--; //consume the token again
        }
    };
}
var stateBeforeCdata1 = ifElseState("C", 23 /* BeforeCdata2 */, 16 /* InDeclaration */);
var stateBeforeCdata2 = ifElseState("D", 24 /* BeforeCdata3 */, 16 /* InDeclaration */);
var stateBeforeCdata3 = ifElseState("A", 25 /* BeforeCdata4 */, 16 /* InDeclaration */);
var stateBeforeCdata4 = ifElseState("T", 26 /* BeforeCdata5 */, 16 /* InDeclaration */);
var stateBeforeCdata5 = ifElseState("A", 27 /* BeforeCdata6 */, 16 /* InDeclaration */);
var stateBeforeScript1 = consumeSpecialNameChar("R", 34 /* BeforeScript2 */);
var stateBeforeScript2 = consumeSpecialNameChar("I", 35 /* BeforeScript3 */);
var stateBeforeScript3 = consumeSpecialNameChar("P", 36 /* BeforeScript4 */);
var stateBeforeScript4 = consumeSpecialNameChar("T", 37 /* BeforeScript5 */);
var stateAfterScript1 = ifElseState("R", 39 /* AfterScript2 */, 1 /* Text */);
var stateAfterScript2 = ifElseState("I", 40 /* AfterScript3 */, 1 /* Text */);
var stateAfterScript3 = ifElseState("P", 41 /* AfterScript4 */, 1 /* Text */);
var stateAfterScript4 = ifElseState("T", 42 /* AfterScript5 */, 1 /* Text */);
var stateBeforeStyle1 = consumeSpecialNameChar("Y", 44 /* BeforeStyle2 */);
var stateBeforeStyle2 = consumeSpecialNameChar("L", 45 /* BeforeStyle3 */);
var stateBeforeStyle3 = consumeSpecialNameChar("E", 46 /* BeforeStyle4 */);
var stateAfterStyle1 = ifElseState("Y", 48 /* AfterStyle2 */, 1 /* Text */);
var stateAfterStyle2 = ifElseState("L", 49 /* AfterStyle3 */, 1 /* Text */);
var stateAfterStyle3 = ifElseState("E", 50 /* AfterStyle4 */, 1 /* Text */);
var stateBeforeEntity = ifElseState("#", 52 /* BeforeNumericEntity */, 53 /* InNamedEntity */);
var stateBeforeNumericEntity = ifElseState("X", 55 /* InHexEntity */, 54 /* InNumericEntity */);
var Tokenizer = /** @class */ (function () {
    function Tokenizer(options, cbs) {
        /** The current state the tokenizer is in. */
        this._state = 1 /* Text */;
        /** The read buffer. */
        this._buffer = "";
        /** The beginning of the section that is currently being read. */
        this._sectionStart = 0;
        /** The index within the buffer that we are currently looking at. */
        this._index = 0;
        /**
         * Data that has already been processed will be removed from the buffer occasionally.
         * `_bufferOffset` keeps track of how many characters have been removed, to make sure position information is accurate.
         */
        this._bufferOffset = 0;
        /** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
        this._baseState = 1 /* Text */;
        /** For special parsing behavior inside of script and style tags. */
        this._special = 1 /* None */;
        /** Indicates whether the tokenizer has been paused. */
        this._running = true;
        /** Indicates whether the tokenizer has finished running / `.end` has been called. */
        this._ended = false;
        this._cbs = cbs;
        this._xmlMode = !!(options && options.xmlMode);
        this._decodeEntities = !!(options && options.decodeEntities);
    }
    Tokenizer.prototype.reset = function () {
        this._state = 1 /* Text */;
        this._buffer = "";
        this._sectionStart = 0;
        this._index = 0;
        this._bufferOffset = 0;
        this._baseState = 1 /* Text */;
        this._special = 1 /* None */;
        this._running = true;
        this._ended = false;
    };
    Tokenizer.prototype._stateText = function (c) {
        if (c === "<") {
            if (this._index > this._sectionStart) {
                this._cbs.ontext(this._getSection());
            }
            this._state = 2 /* BeforeTagName */;
            this._sectionStart = this._index;
        }
        else if (this._decodeEntities &&
            this._special === 1 /* None */ &&
            c === "&") {
            if (this._index > this._sectionStart) {
                this._cbs.ontext(this._getSection());
            }
            this._baseState = 1 /* Text */;
            this._state = 51 /* BeforeEntity */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateBeforeTagName = function (c) {
        if (c === "/") {
            this._state = 5 /* BeforeClosingTagName */;
        }
        else if (c === "<") {
            this._cbs.ontext(this._getSection());
            this._sectionStart = this._index;
        }
        else if (c === ">" ||
            this._special !== 1 /* None */ ||
            whitespace(c)) {
            this._state = 1 /* Text */;
        }
        else if (c === "!") {
            this._state = 15 /* BeforeDeclaration */;
            this._sectionStart = this._index + 1;
        }
        else if (c === "?") {
            this._state = 17 /* InProcessingInstruction */;
            this._sectionStart = this._index + 1;
        }
        else {
            this._state =
                !this._xmlMode && (c === "s" || c === "S")
                    ? 31 /* BeforeSpecial */
                    : 3 /* InTagName */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInTagName = function (c) {
        if (c === "/" || c === ">" || whitespace(c)) {
            this._emitToken("onopentagname");
            this._state = 8 /* BeforeAttributeName */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateBeforeClosingTagName = function (c) {
        if (whitespace(c)) {
            // ignore
        }
        else if (c === ">") {
            this._state = 1 /* Text */;
        }
        else if (this._special !== 1 /* None */) {
            if (c === "s" || c === "S") {
                this._state = 32 /* BeforeSpecialEnd */;
            }
            else {
                this._state = 1 /* Text */;
                this._index--;
            }
        }
        else {
            this._state = 6 /* InClosingTagName */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInClosingTagName = function (c) {
        if (c === ">" || whitespace(c)) {
            this._emitToken("onclosetag");
            this._state = 7 /* AfterClosingTagName */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateAfterClosingTagName = function (c) {
        //skip everything until ">"
        if (c === ">") {
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
    };
    Tokenizer.prototype._stateBeforeAttributeName = function (c) {
        if (c === ">") {
            this._cbs.onopentagend();
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
        else if (c === "/") {
            this._state = 4 /* InSelfClosingTag */;
        }
        else if (!whitespace(c)) {
            this._state = 9 /* InAttributeName */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInSelfClosingTag = function (c) {
        if (c === ">") {
            this._cbs.onselfclosingtag();
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
        else if (!whitespace(c)) {
            this._state = 8 /* BeforeAttributeName */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateInAttributeName = function (c) {
        if (c === "=" || c === "/" || c === ">" || whitespace(c)) {
            this._cbs.onattribname(this._getSection());
            this._sectionStart = -1;
            this._state = 10 /* AfterAttributeName */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateAfterAttributeName = function (c) {
        if (c === "=") {
            this._state = 11 /* BeforeAttributeValue */;
        }
        else if (c === "/" || c === ">") {
            this._cbs.onattribend();
            this._state = 8 /* BeforeAttributeName */;
            this._index--;
        }
        else if (!whitespace(c)) {
            this._cbs.onattribend();
            this._state = 9 /* InAttributeName */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateBeforeAttributeValue = function (c) {
        if (c === '"') {
            this._state = 12 /* InAttributeValueDq */;
            this._sectionStart = this._index + 1;
        }
        else if (c === "'") {
            this._state = 13 /* InAttributeValueSq */;
            this._sectionStart = this._index + 1;
        }
        else if (!whitespace(c)) {
            this._state = 14 /* InAttributeValueNq */;
            this._sectionStart = this._index;
            this._index--; //reconsume token
        }
    };
    Tokenizer.prototype._stateInAttributeValueDoubleQuotes = function (c) {
        if (c === '"') {
            this._emitToken("onattribdata");
            this._cbs.onattribend();
            this._state = 8 /* BeforeAttributeName */;
        }
        else if (this._decodeEntities && c === "&") {
            this._emitToken("onattribdata");
            this._baseState = this._state;
            this._state = 51 /* BeforeEntity */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInAttributeValueSingleQuotes = function (c) {
        if (c === "'") {
            this._emitToken("onattribdata");
            this._cbs.onattribend();
            this._state = 8 /* BeforeAttributeName */;
        }
        else if (this._decodeEntities && c === "&") {
            this._emitToken("onattribdata");
            this._baseState = this._state;
            this._state = 51 /* BeforeEntity */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInAttributeValueNoQuotes = function (c) {
        if (whitespace(c) || c === ">") {
            this._emitToken("onattribdata");
            this._cbs.onattribend();
            this._state = 8 /* BeforeAttributeName */;
            this._index--;
        }
        else if (this._decodeEntities && c === "&") {
            this._emitToken("onattribdata");
            this._baseState = this._state;
            this._state = 51 /* BeforeEntity */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateBeforeDeclaration = function (c) {
        this._state =
            c === "["
                ? 22 /* BeforeCdata1 */
                : c === "-"
                    ? 18 /* BeforeComment */
                    : 16 /* InDeclaration */;
    };
    Tokenizer.prototype._stateInDeclaration = function (c) {
        if (c === ">") {
            this._cbs.ondeclaration(this._getSection());
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
    };
    Tokenizer.prototype._stateInProcessingInstruction = function (c) {
        if (c === ">") {
            this._cbs.onprocessinginstruction(this._getSection());
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
    };
    Tokenizer.prototype._stateBeforeComment = function (c) {
        if (c === "-") {
            this._state = 19 /* InComment */;
            this._sectionStart = this._index + 1;
        }
        else {
            this._state = 16 /* InDeclaration */;
        }
    };
    Tokenizer.prototype._stateInComment = function (c) {
        if (c === "-")
            this._state = 20 /* AfterComment1 */;
    };
    Tokenizer.prototype._stateAfterComment1 = function (c) {
        if (c === "-") {
            this._state = 21 /* AfterComment2 */;
        }
        else {
            this._state = 19 /* InComment */;
        }
    };
    Tokenizer.prototype._stateAfterComment2 = function (c) {
        if (c === ">") {
            //remove 2 trailing chars
            this._cbs.oncomment(this._buffer.substring(this._sectionStart, this._index - 2));
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
        else if (c !== "-") {
            this._state = 19 /* InComment */;
        }
        // else: stay in AFTER_COMMENT_2 (`--->`)
    };
    Tokenizer.prototype._stateBeforeCdata6 = function (c) {
        if (c === "[") {
            this._state = 28 /* InCdata */;
            this._sectionStart = this._index + 1;
        }
        else {
            this._state = 16 /* InDeclaration */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateInCdata = function (c) {
        if (c === "]")
            this._state = 29 /* AfterCdata1 */;
    };
    Tokenizer.prototype._stateAfterCdata1 = function (c) {
        if (c === "]")
            this._state = 30 /* AfterCdata2 */;
        else
            this._state = 28 /* InCdata */;
    };
    Tokenizer.prototype._stateAfterCdata2 = function (c) {
        if (c === ">") {
            //remove 2 trailing chars
            this._cbs.oncdata(this._buffer.substring(this._sectionStart, this._index - 2));
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
        else if (c !== "]") {
            this._state = 28 /* InCdata */;
        }
        //else: stay in AFTER_CDATA_2 (`]]]>`)
    };
    Tokenizer.prototype._stateBeforeSpecial = function (c) {
        if (c === "c" || c === "C") {
            this._state = 33 /* BeforeScript1 */;
        }
        else if (c === "t" || c === "T") {
            this._state = 43 /* BeforeStyle1 */;
        }
        else {
            this._state = 3 /* InTagName */;
            this._index--; //consume the token again
        }
    };
    Tokenizer.prototype._stateBeforeSpecialEnd = function (c) {
        if (this._special === 2 /* Script */ && (c === "c" || c === "C")) {
            this._state = 38 /* AfterScript1 */;
        }
        else if (this._special === 3 /* Style */ &&
            (c === "t" || c === "T")) {
            this._state = 47 /* AfterStyle1 */;
        }
        else
            this._state = 1 /* Text */;
    };
    Tokenizer.prototype._stateBeforeScript5 = function (c) {
        if (c === "/" || c === ">" || whitespace(c)) {
            this._special = 2 /* Script */;
        }
        this._state = 3 /* InTagName */;
        this._index--; //consume the token again
    };
    Tokenizer.prototype._stateAfterScript5 = function (c) {
        if (c === ">" || whitespace(c)) {
            this._special = 1 /* None */;
            this._state = 6 /* InClosingTagName */;
            this._sectionStart = this._index - 6;
            this._index--; //reconsume the token
        }
        else
            this._state = 1 /* Text */;
    };
    Tokenizer.prototype._stateBeforeStyle4 = function (c) {
        if (c === "/" || c === ">" || whitespace(c)) {
            this._special = 3 /* Style */;
        }
        this._state = 3 /* InTagName */;
        this._index--; //consume the token again
    };
    Tokenizer.prototype._stateAfterStyle4 = function (c) {
        if (c === ">" || whitespace(c)) {
            this._special = 1 /* None */;
            this._state = 6 /* InClosingTagName */;
            this._sectionStart = this._index - 5;
            this._index--; //reconsume the token
        }
        else
            this._state = 1 /* Text */;
    };
    //for entities terminated with a semicolon
    Tokenizer.prototype._parseNamedEntityStrict = function () {
        //offset = 1
        if (this._sectionStart + 1 < this._index) {
            var entity = this._buffer.substring(this._sectionStart + 1, this._index), map = this._xmlMode ? xml_json_1.default : entities_json_1.default;
            if (Object.prototype.hasOwnProperty.call(map, entity)) {
                // @ts-ignore
                this._emitPartial(map[entity]);
                this._sectionStart = this._index + 1;
            }
        }
    };
    //parses legacy entities (without trailing semicolon)
    Tokenizer.prototype._parseLegacyEntity = function () {
        var start = this._sectionStart + 1;
        var limit = this._index - start;
        if (limit > 6)
            limit = 6; // The max length of legacy entities is 6
        while (limit >= 2) {
            // The min length of legacy entities is 2
            var entity = this._buffer.substr(start, limit);
            if (Object.prototype.hasOwnProperty.call(legacy_json_1.default, entity)) {
                // @ts-ignore
                this._emitPartial(legacy_json_1.default[entity]);
                this._sectionStart += limit + 1;
                return;
            }
            else {
                limit--;
            }
        }
    };
    Tokenizer.prototype._stateInNamedEntity = function (c) {
        if (c === ";") {
            this._parseNamedEntityStrict();
            if (this._sectionStart + 1 < this._index && !this._xmlMode) {
                this._parseLegacyEntity();
            }
            this._state = this._baseState;
        }
        else if ((c < "a" || c > "z") &&
            (c < "A" || c > "Z") &&
            (c < "0" || c > "9")) {
            if (this._xmlMode || this._sectionStart + 1 === this._index) {
                // ignore
            }
            else if (this._baseState !== 1 /* Text */) {
                if (c !== "=") {
                    this._parseNamedEntityStrict();
                }
            }
            else {
                this._parseLegacyEntity();
            }
            this._state = this._baseState;
            this._index--;
        }
    };
    Tokenizer.prototype._decodeNumericEntity = function (offset, base) {
        var sectionStart = this._sectionStart + offset;
        if (sectionStart !== this._index) {
            //parse entity
            var entity = this._buffer.substring(sectionStart, this._index);
            var parsed = parseInt(entity, base);
            this._emitPartial(decode_codepoint_1.default(parsed));
            this._sectionStart = this._index;
        }
        else {
            this._sectionStart--;
        }
        this._state = this._baseState;
    };
    Tokenizer.prototype._stateInNumericEntity = function (c) {
        if (c === ";") {
            this._decodeNumericEntity(2, 10);
            this._sectionStart++;
        }
        else if (c < "0" || c > "9") {
            if (!this._xmlMode) {
                this._decodeNumericEntity(2, 10);
            }
            else {
                this._state = this._baseState;
            }
            this._index--;
        }
    };
    Tokenizer.prototype._stateInHexEntity = function (c) {
        if (c === ";") {
            this._decodeNumericEntity(3, 16);
            this._sectionStart++;
        }
        else if ((c < "a" || c > "f") &&
            (c < "A" || c > "F") &&
            (c < "0" || c > "9")) {
            if (!this._xmlMode) {
                this._decodeNumericEntity(3, 16);
            }
            else {
                this._state = this._baseState;
            }
            this._index--;
        }
    };
    Tokenizer.prototype._cleanup = function () {
        if (this._sectionStart < 0) {
            this._buffer = "";
            this._bufferOffset += this._index;
            this._index = 0;
        }
        else if (this._running) {
            if (this._state === 1 /* Text */) {
                if (this._sectionStart !== this._index) {
                    this._cbs.ontext(this._buffer.substr(this._sectionStart));
                }
                this._buffer = "";
                this._bufferOffset += this._index;
                this._index = 0;
            }
            else if (this._sectionStart === this._index) {
                //the section just started
                this._buffer = "";
                this._bufferOffset += this._index;
                this._index = 0;
            }
            else {
                //remove everything unnecessary
                this._buffer = this._buffer.substr(this._sectionStart);
                this._index -= this._sectionStart;
                this._bufferOffset += this._sectionStart;
            }
            this._sectionStart = 0;
        }
    };
    //TODO make events conditional
    Tokenizer.prototype.write = function (chunk) {
        if (this._ended)
            this._cbs.onerror(Error(".write() after done!"));
        this._buffer += chunk;
        this._parse();
    };
    // Iterates through the buffer, calling the function corresponding to the current state.
    // States that are more likely to be hit are higher up, as a performance improvement.
    Tokenizer.prototype._parse = function () {
        while (this._index < this._buffer.length && this._running) {
            var c = this._buffer.charAt(this._index);
            if (this._state === 1 /* Text */) {
                this._stateText(c);
            }
            else if (this._state === 12 /* InAttributeValueDq */) {
                this._stateInAttributeValueDoubleQuotes(c);
            }
            else if (this._state === 9 /* InAttributeName */) {
                this._stateInAttributeName(c);
            }
            else if (this._state === 19 /* InComment */) {
                this._stateInComment(c);
            }
            else if (this._state === 8 /* BeforeAttributeName */) {
                this._stateBeforeAttributeName(c);
            }
            else if (this._state === 3 /* InTagName */) {
                this._stateInTagName(c);
            }
            else if (this._state === 6 /* InClosingTagName */) {
                this._stateInClosingTagName(c);
            }
            else if (this._state === 2 /* BeforeTagName */) {
                this._stateBeforeTagName(c);
            }
            else if (this._state === 10 /* AfterAttributeName */) {
                this._stateAfterAttributeName(c);
            }
            else if (this._state === 13 /* InAttributeValueSq */) {
                this._stateInAttributeValueSingleQuotes(c);
            }
            else if (this._state === 11 /* BeforeAttributeValue */) {
                this._stateBeforeAttributeValue(c);
            }
            else if (this._state === 5 /* BeforeClosingTagName */) {
                this._stateBeforeClosingTagName(c);
            }
            else if (this._state === 7 /* AfterClosingTagName */) {
                this._stateAfterClosingTagName(c);
            }
            else if (this._state === 31 /* BeforeSpecial */) {
                this._stateBeforeSpecial(c);
            }
            else if (this._state === 20 /* AfterComment1 */) {
                this._stateAfterComment1(c);
            }
            else if (this._state === 14 /* InAttributeValueNq */) {
                this._stateInAttributeValueNoQuotes(c);
            }
            else if (this._state === 4 /* InSelfClosingTag */) {
                this._stateInSelfClosingTag(c);
            }
            else if (this._state === 16 /* InDeclaration */) {
                this._stateInDeclaration(c);
            }
            else if (this._state === 15 /* BeforeDeclaration */) {
                this._stateBeforeDeclaration(c);
            }
            else if (this._state === 21 /* AfterComment2 */) {
                this._stateAfterComment2(c);
            }
            else if (this._state === 18 /* BeforeComment */) {
                this._stateBeforeComment(c);
            }
            else if (this._state === 32 /* BeforeSpecialEnd */) {
                this._stateBeforeSpecialEnd(c);
            }
            else if (this._state === 38 /* AfterScript1 */) {
                stateAfterScript1(this, c);
            }
            else if (this._state === 39 /* AfterScript2 */) {
                stateAfterScript2(this, c);
            }
            else if (this._state === 40 /* AfterScript3 */) {
                stateAfterScript3(this, c);
            }
            else if (this._state === 33 /* BeforeScript1 */) {
                stateBeforeScript1(this, c);
            }
            else if (this._state === 34 /* BeforeScript2 */) {
                stateBeforeScript2(this, c);
            }
            else if (this._state === 35 /* BeforeScript3 */) {
                stateBeforeScript3(this, c);
            }
            else if (this._state === 36 /* BeforeScript4 */) {
                stateBeforeScript4(this, c);
            }
            else if (this._state === 37 /* BeforeScript5 */) {
                this._stateBeforeScript5(c);
            }
            else if (this._state === 41 /* AfterScript4 */) {
                stateAfterScript4(this, c);
            }
            else if (this._state === 42 /* AfterScript5 */) {
                this._stateAfterScript5(c);
            }
            else if (this._state === 43 /* BeforeStyle1 */) {
                stateBeforeStyle1(this, c);
            }
            else if (this._state === 28 /* InCdata */) {
                this._stateInCdata(c);
            }
            else if (this._state === 44 /* BeforeStyle2 */) {
                stateBeforeStyle2(this, c);
            }
            else if (this._state === 45 /* BeforeStyle3 */) {
                stateBeforeStyle3(this, c);
            }
            else if (this._state === 46 /* BeforeStyle4 */) {
                this._stateBeforeStyle4(c);
            }
            else if (this._state === 47 /* AfterStyle1 */) {
                stateAfterStyle1(this, c);
            }
            else if (this._state === 48 /* AfterStyle2 */) {
                stateAfterStyle2(this, c);
            }
            else if (this._state === 49 /* AfterStyle3 */) {
                stateAfterStyle3(this, c);
            }
            else if (this._state === 50 /* AfterStyle4 */) {
                this._stateAfterStyle4(c);
            }
            else if (this._state === 17 /* InProcessingInstruction */) {
                this._stateInProcessingInstruction(c);
            }
            else if (this._state === 53 /* InNamedEntity */) {
                this._stateInNamedEntity(c);
            }
            else if (this._state === 22 /* BeforeCdata1 */) {
                stateBeforeCdata1(this, c);
            }
            else if (this._state === 51 /* BeforeEntity */) {
                stateBeforeEntity(this, c);
            }
            else if (this._state === 23 /* BeforeCdata2 */) {
                stateBeforeCdata2(this, c);
            }
            else if (this._state === 24 /* BeforeCdata3 */) {
                stateBeforeCdata3(this, c);
            }
            else if (this._state === 29 /* AfterCdata1 */) {
                this._stateAfterCdata1(c);
            }
            else if (this._state === 30 /* AfterCdata2 */) {
                this._stateAfterCdata2(c);
            }
            else if (this._state === 25 /* BeforeCdata4 */) {
                stateBeforeCdata4(this, c);
            }
            else if (this._state === 26 /* BeforeCdata5 */) {
                stateBeforeCdata5(this, c);
            }
            else if (this._state === 27 /* BeforeCdata6 */) {
                this._stateBeforeCdata6(c);
            }
            else if (this._state === 55 /* InHexEntity */) {
                this._stateInHexEntity(c);
            }
            else if (this._state === 54 /* InNumericEntity */) {
                this._stateInNumericEntity(c);
            }
            else if (this._state === 52 /* BeforeNumericEntity */) {
                stateBeforeNumericEntity(this, c);
            }
            else {
                this._cbs.onerror(Error("unknown _state"), this._state);
            }
            this._index++;
        }
        this._cleanup();
    };
    Tokenizer.prototype.pause = function () {
        this._running = false;
    };
    Tokenizer.prototype.resume = function () {
        this._running = true;
        if (this._index < this._buffer.length) {
            this._parse();
        }
        if (this._ended) {
            this._finish();
        }
    };
    Tokenizer.prototype.end = function (chunk) {
        if (this._ended)
            this._cbs.onerror(Error(".end() after done!"));
        if (chunk)
            this.write(chunk);
        this._ended = true;
        if (this._running)
            this._finish();
    };
    Tokenizer.prototype._finish = function () {
        //if there is remaining data, emit it in a reasonable way
        if (this._sectionStart < this._index) {
            this._handleTrailingData();
        }
        this._cbs.onend();
    };
    Tokenizer.prototype._handleTrailingData = function () {
        var data = this._buffer.substr(this._sectionStart);
        if (this._state === 28 /* InCdata */ ||
            this._state === 29 /* AfterCdata1 */ ||
            this._state === 30 /* AfterCdata2 */) {
            this._cbs.oncdata(data);
        }
        else if (this._state === 19 /* InComment */ ||
            this._state === 20 /* AfterComment1 */ ||
            this._state === 21 /* AfterComment2 */) {
            this._cbs.oncomment(data);
        }
        else if (this._state === 53 /* InNamedEntity */ && !this._xmlMode) {
            this._parseLegacyEntity();
            if (this._sectionStart < this._index) {
                this._state = this._baseState;
                this._handleTrailingData();
            }
        }
        else if (this._state === 54 /* InNumericEntity */ && !this._xmlMode) {
            this._decodeNumericEntity(2, 10);
            if (this._sectionStart < this._index) {
                this._state = this._baseState;
                this._handleTrailingData();
            }
        }
        else if (this._state === 55 /* InHexEntity */ && !this._xmlMode) {
            this._decodeNumericEntity(3, 16);
            if (this._sectionStart < this._index) {
                this._state = this._baseState;
                this._handleTrailingData();
            }
        }
        else if (this._state !== 3 /* InTagName */ &&
            this._state !== 8 /* BeforeAttributeName */ &&
            this._state !== 11 /* BeforeAttributeValue */ &&
            this._state !== 10 /* AfterAttributeName */ &&
            this._state !== 9 /* InAttributeName */ &&
            this._state !== 13 /* InAttributeValueSq */ &&
            this._state !== 12 /* InAttributeValueDq */ &&
            this._state !== 14 /* InAttributeValueNq */ &&
            this._state !== 6 /* InClosingTagName */) {
            this._cbs.ontext(data);
        }
        //else, ignore remaining data
        //TODO add a way to remove current tag
    };
    Tokenizer.prototype.getAbsoluteIndex = function () {
        return this._bufferOffset + this._index;
    };
    Tokenizer.prototype._getSection = function () {
        return this._buffer.substring(this._sectionStart, this._index);
    };
    Tokenizer.prototype._emitToken = function (name) {
        this._cbs[name](this._getSection());
        this._sectionStart = -1;
    };
    Tokenizer.prototype._emitPartial = function (value) {
        if (this._baseState !== 1 /* Text */) {
            this._cbs.onattribdata(value); //TODO implement the new event
        }
        else {
            this._cbs.ontext(value);
        }
    };
    return Tokenizer;
}());
exports.default = Tokenizer;
