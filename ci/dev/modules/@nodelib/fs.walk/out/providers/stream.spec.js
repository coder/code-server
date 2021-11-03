"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const stream_1 = require("stream");
const sinon = require("sinon");
const settings_1 = require("../settings");
const tests = require("../tests");
const stream_2 = require("./stream");
class TestProvider extends stream_2.default {
    constructor(_root, _settings = new settings_1.default()) {
        super(_root, _settings);
        this._reader = new tests.TestAsyncReader();
        this._stream.emit = sinon.stub();
        this._stream.push = sinon.stub();
    }
    get reader() {
        return this._reader;
    }
    get stream() {
        return this._stream;
    }
}
describe('Providers → Stream', () => {
    describe('.read', () => {
        it('should return stream', () => {
            const provider = new TestProvider('directory');
            const stream = provider.read();
            assert.ok(stream instanceof stream_1.Readable);
        });
        it('should call reader function with correct set of arguments', () => {
            const provider = new TestProvider('directory');
            provider.read();
            assert.ok(provider.reader.read.called);
        });
        it('should re-emit the "error" event from reader', () => {
            const provider = new TestProvider('directory');
            provider.reader.onError.yields(tests.EPERM_ERRNO);
            provider.read();
            assert.deepStrictEqual(provider.stream.emit.args, [['error', tests.EPERM_ERRNO]]);
        });
        it('should call the "push" method with entry value for the "entry" event from reader', () => {
            const provider = new TestProvider('directory');
            const fakeEntry = tests.buildFakeFileEntry();
            provider.reader.onEntry.yields(fakeEntry);
            provider.read();
            assert.deepStrictEqual(provider.stream.push.args, [[fakeEntry]]);
        });
        it('should call the "push" method with "null" value for the "end" event from reader', () => {
            const provider = new TestProvider('directory');
            provider.reader.onEnd.yields();
            provider.read();
            assert.deepStrictEqual(provider.stream.push.args, [[null]]);
        });
        it('should do not destroy reader when it is already destroyed', () => {
            const provider = new TestProvider('directory');
            const stream = provider.read();
            stream.destroy();
            assert.ok(stream.destroyed);
            assert.doesNotThrow(() => stream.destroy());
        });
    });
});
