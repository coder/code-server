/// <reference types="node" />
import * as fs from 'fs';
export declare type Entry = {
    dirent: Dirent;
    name: string;
    path: string;
    stats?: Stats;
};
export declare type Stats = fs.Stats;
export declare type Dirent = {
    isBlockDevice(): boolean;
    isCharacterDevice(): boolean;
    isDirectory(): boolean;
    isFIFO(): boolean;
    isFile(): boolean;
    isSocket(): boolean;
    isSymbolicLink(): boolean;
    name: string;
};
//# sourceMappingURL=index.d.ts.map