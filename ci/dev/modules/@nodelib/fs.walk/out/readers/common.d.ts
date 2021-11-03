import Settings, { FilterFunction } from '../settings';
import { Errno } from '../types';
export declare function isFatalError(settings: Settings, error: Errno): boolean;
export declare function isAppliedFilter<T>(filter: FilterFunction<T> | null, value: T): boolean;
export declare function replacePathSegmentSeparator(filepath: string, separator: string): string;
export declare function joinPathSegments(a: string, b: string, separator: string): string;
//# sourceMappingURL=common.d.ts.map