import AsyncReader from '../readers/async';
import Settings from '../settings';
import { Entry, Errno } from '../types';
export declare type AsyncCallback = (err: Errno, entries: Entry[]) => void;
export default class AsyncProvider {
    private readonly _root;
    private readonly _settings;
    protected readonly _reader: AsyncReader;
    private readonly _storage;
    constructor(_root: string, _settings: Settings);
    read(callback: AsyncCallback): void;
}
//# sourceMappingURL=async.d.ts.map