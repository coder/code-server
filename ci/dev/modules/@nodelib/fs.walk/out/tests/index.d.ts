import * as sinon from 'sinon';
import { Entry, Errno } from '../types';
export declare function buildFakeFileEntry(entry?: Partial<Entry>): Entry;
export declare function buildFakeDirectoryEntry(entry?: Partial<Entry>): Entry;
export declare const EPERM_ERRNO: Errno;
export declare class TestAsyncReader {
    read: sinon.SinonStub;
    destroy: sinon.SinonStub;
    onError: sinon.SinonStub;
    onEntry: sinon.SinonStub;
    onEnd: sinon.SinonStub;
}
export declare class TestSyncReader {
    read: sinon.SinonStub;
}
//# sourceMappingURL=index.d.ts.map