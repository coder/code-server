/// <reference types="node" />
import * as scandir from '@nodelib/fs.scandir';
export declare type Entry = scandir.Entry;
export declare type Errno = NodeJS.ErrnoException;
export declare type QueueItem = {
    directory: string;
    base?: string;
};
//# sourceMappingURL=index.d.ts.map