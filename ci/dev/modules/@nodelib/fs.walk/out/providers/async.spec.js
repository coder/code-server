"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const sinon = require("sinon");
const settings_1 = require("../settings");
const tests = require("../tests");
const async_1 = require("./async");
class TestProvider extends async_1.default {
    constructor(_root, _settings = new settings_1.default()) {
        super(_root, _settings);
        this._reader = new tests.TestAsyncReader();
    }
    get reader() {
        return this._reader;
    }
}
describe('Providers → Async', () => {
    describe('.read', () => {
        it('should call reader function with correct set of arguments', () => {
            const provider = new TestProvider('directory');
            const fakeCallback = sinon.stub();
            provider.read(fakeCallback);
            assert.ok(provider.reader.read.called);
        });
        it('should call callback with error for failed launch', () => {
            const provider = new TestProvider('directory');
            const fakeCallback = sinon.stub();
            provider.reader.onError.yields(tests.EPERM_ERRNO);
            provider.read(fakeCallback);
            assert.deepStrictEqual(fakeCallback.args, [[tests.EPERM_ERRNO]]);
        });
        it('should push entries to storage and call callback with array of entries', () => {
            const provider = new TestProvider('directory');
            const fakeEntry = tests.buildFakeFileEntry();
            const fakeCallback = sinon.stub();
            provider.reader.onEntry.yields(fakeEntry);
            provider.reader.onEnd.yields();
            provider.read(fakeCallback);
            assert.deepStrictEqual(fakeCallback.args, [[null, [fakeEntry]]]);
        });
    });
});
