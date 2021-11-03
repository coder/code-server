"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSyncReader = exports.TestAsyncReader = exports.EPERM_ERRNO = exports.buildFakeDirectoryEntry = exports.buildFakeFileEntry = void 0;
const sinon = require("sinon");
const fs_macchiato_1 = require("../../../fs.macchiato");
function buildFakeFileEntry(entry) {
    return Object.assign({ name: 'fake.txt', path: 'directory/fake.txt', dirent: new fs_macchiato_1.Dirent({ name: 'fake.txt' }) }, entry);
}
exports.buildFakeFileEntry = buildFakeFileEntry;
function buildFakeDirectoryEntry(entry) {
    return Object.assign({ name: 'fake', path: 'directory/fake', dirent: new fs_macchiato_1.Dirent({ name: 'fake', isFile: false, isDirectory: true }) }, entry);
}
exports.buildFakeDirectoryEntry = buildFakeDirectoryEntry;
exports.EPERM_ERRNO = {
    name: 'EPERM',
    code: 'EPERM',
    message: 'EPERM'
};
class TestAsyncReader {
    constructor() {
        this.read = sinon.stub();
        this.destroy = sinon.stub();
        this.onError = sinon.stub();
        this.onEntry = sinon.stub();
        this.onEnd = sinon.stub();
    }
}
exports.TestAsyncReader = TestAsyncReader;
class TestSyncReader {
    constructor() {
        this.read = sinon.stub();
    }
}
exports.TestSyncReader = TestSyncReader;
