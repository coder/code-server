"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs_macchiato_1 = require("../../../fs.macchiato");
const util = require("./fs");
describe('Utils → FS', () => {
    describe('.createDirentFromStats', () => {
        it('should convert fs.Stats to fs.Dirent', () => {
            const actual = util.createDirentFromStats('name', new fs_macchiato_1.Stats());
            assert.strictEqual(actual.name, 'name');
            assert.ok(!actual.isBlockDevice());
            assert.ok(!actual.isCharacterDevice());
            assert.ok(!actual.isDirectory());
            assert.ok(!actual.isFIFO());
            assert.ok(actual.isFile());
            assert.ok(!actual.isSocket());
            assert.ok(!actual.isSymbolicLink());
        });
    });
});
