/** All the states the tokenizer can be in. */
declare const enum State {
    Text = 1,
    BeforeTagName = 2,
    InTagName = 3,
    InSelfClosingTag = 4,
    BeforeClosingTagName = 5,
    InClosingTagName = 6,
    AfterClosingTagName = 7,
    BeforeAttributeName = 8,
    InAttributeName = 9,
    AfterAttributeName = 10,
    BeforeAttributeValue = 11,
    InAttributeValueDq = 12,
    InAttributeValueSq = 13,
    InAttributeValueNq = 14,
    BeforeDeclaration = 15,
    InDeclaration = 16,
    InProcessingInstruction = 17,
    BeforeComment = 18,
    InComment = 19,
    AfterComment1 = 20,
    AfterComment2 = 21,
    BeforeCdata1 = 22,
    BeforeCdata2 = 23,
    BeforeCdata3 = 24,
    BeforeCdata4 = 25,
    BeforeCdata5 = 26,
    BeforeCdata6 = 27,
    InCdata = 28,
    AfterCdata1 = 29,
    AfterCdata2 = 30,
    BeforeSpecial = 31,
    BeforeSpecialEnd = 32,
    BeforeScript1 = 33,
    BeforeScript2 = 34,
    BeforeScript3 = 35,
    BeforeScript4 = 36,
    BeforeScript5 = 37,
    AfterScript1 = 38,
    AfterScript2 = 39,
    AfterScript3 = 40,
    AfterScript4 = 41,
    AfterScript5 = 42,
    BeforeStyle1 = 43,
    BeforeStyle2 = 44,
    BeforeStyle3 = 45,
    BeforeStyle4 = 46,
    AfterStyle1 = 47,
    AfterStyle2 = 48,
    AfterStyle3 = 49,
    AfterStyle4 = 50,
    BeforeEntity = 51,
    BeforeNumericEntity = 52,
    InNamedEntity = 53,
    InNumericEntity = 54,
    InHexEntity = 55
}
declare const enum Special {
    None = 1,
    Script = 2,
    Style = 3
}
interface Callbacks {
    onattribdata(value: string): void;
    onattribend(): void;
    onattribname(name: string): void;
    oncdata(data: string): void;
    onclosetag(name: string): void;
    oncomment(data: string): void;
    ondeclaration(content: string): void;
    onend(): void;
    onerror(error: Error, state?: State): void;
    onopentagend(): void;
    onopentagname(name: string): void;
    onprocessinginstruction(instruction: string): void;
    onselfclosingtag(): void;
    ontext(value: string): void;
}
export default class Tokenizer {
    /** The current state the tokenizer is in. */
    _state: State;
    /** The read buffer. */
    _buffer: string;
    /** The beginning of the section that is currently being read. */
    _sectionStart: number;
    /** The index within the buffer that we are currently looking at. */
    _index: number;
    /**
     * Data that has already been processed will be removed from the buffer occasionally.
     * `_bufferOffset` keeps track of how many characters have been removed, to make sure position information is accurate.
     */
    _bufferOffset: number;
    /** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
    _baseState: State;
    /** For special parsing behavior inside of script and style tags. */
    _special: Special;
    /** Indicates whether the tokenizer has been paused. */
    _running: boolean;
    /** Indicates whether the tokenizer has finished running / `.end` has been called. */
    _ended: boolean;
    _cbs: Callbacks;
    _xmlMode: boolean;
    _decodeEntities: boolean;
    constructor(options: {
        xmlMode?: boolean;
        decodeEntities?: boolean;
    } | null, cbs: Callbacks);
    reset(): void;
    _stateText(c: string): void;
    _stateBeforeTagName(c: string): void;
    _stateInTagName(c: string): void;
    _stateBeforeClosingTagName(c: string): void;
    _stateInClosingTagName(c: string): void;
    _stateAfterClosingTagName(c: string): void;
    _stateBeforeAttributeName(c: string): void;
    _stateInSelfClosingTag(c: string): void;
    _stateInAttributeName(c: string): void;
    _stateAfterAttributeName(c: string): void;
    _stateBeforeAttributeValue(c: string): void;
    _stateInAttributeValueDoubleQuotes(c: string): void;
    _stateInAttributeValueSingleQuotes(c: string): void;
    _stateInAttributeValueNoQuotes(c: string): void;
    _stateBeforeDeclaration(c: string): void;
    _stateInDeclaration(c: string): void;
    _stateInProcessingInstruction(c: string): void;
    _stateBeforeComment(c: string): void;
    _stateInComment(c: string): void;
    _stateAfterComment1(c: string): void;
    _stateAfterComment2(c: string): void;
    _stateBeforeCdata6(c: string): void;
    _stateInCdata(c: string): void;
    _stateAfterCdata1(c: string): void;
    _stateAfterCdata2(c: string): void;
    _stateBeforeSpecial(c: string): void;
    _stateBeforeSpecialEnd(c: string): void;
    _stateBeforeScript5(c: string): void;
    _stateAfterScript5(c: string): void;
    _stateBeforeStyle4(c: string): void;
    _stateAfterStyle4(c: string): void;
    _parseNamedEntityStrict(): void;
    _parseLegacyEntity(): void;
    _stateInNamedEntity(c: string): void;
    _decodeNumericEntity(offset: number, base: number): void;
    _stateInNumericEntity(c: string): void;
    _stateInHexEntity(c: string): void;
    _cleanup(): void;
    write(chunk: string): void;
    _parse(): void;
    pause(): void;
    resume(): void;
    end(chunk?: string): void;
    _finish(): void;
    _handleTrailingData(): void;
    getAbsoluteIndex(): number;
    _getSection(): string;
    _emitToken(name: "onopentagname" | "onclosetag" | "onattribdata"): void;
    _emitPartial(value: string): void;
}
export {};
//# sourceMappingURL=Tokenizer.d.ts.map