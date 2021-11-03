import Settings from '../settings';
import { ErrnoException, Stats } from '../types';
export declare type AsyncCallback = (err: ErrnoException, stats: Stats) => void;
export declare function read(path: string, settings: Settings, callback: AsyncCallback): void;
//# sourceMappingURL=async.d.ts.map