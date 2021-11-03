"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const settings_1 = require("../settings");
const tests = require("../tests");
const sync_1 = require("./sync");
class TestProvider extends sync_1.default {
    constructor(_root, _settings = new settings_1.default()) {
        super(_root, _settings);
        this._reader = new tests.TestSyncReader();
    }
    get reader() {
        return this._reader;
    }
}
describe('Providers → Sync', () => {
    describe('.read', () => {
        it('should call reader function with correct set of arguments and got result', () => {
            const provider = new TestProvider('directory');
            const fakeEntry = tests.buildFakeFileEntry();
            provider.reader.read.returns([fakeEntry]);
            const actual = provider.read();
            assert.deepStrictEqual(actual, [fakeEntry]);
            assert.ok(provider.reader.read.called);
        });
    });
});
