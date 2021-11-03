/// <reference types="node" />
import Settings from '../settings';
import { Entry } from '../types';
export declare type AsyncCallback = (err: NodeJS.ErrnoException, entries: Entry[]) => void;
export declare function read(directory: string, settings: Settings, callback: AsyncCallback): void;
export declare function readdirWithFileTypes(directory: string, settings: Settings, callback: AsyncCallback): void;
export declare function readdir(directory: string, settings: Settings, callback: AsyncCallback): void;
//# sourceMappingURL=async.d.ts.map