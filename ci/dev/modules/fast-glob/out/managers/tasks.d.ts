import Settings from '../settings';
import { Pattern, PatternsGroup } from '../types';
export declare type Task = {
    base: string;
    dynamic: boolean;
    patterns: Pattern[];
    positive: Pattern[];
    negative: Pattern[];
};
export declare function generate(patterns: Pattern[], settings: Settings): Task[];
export declare function convertPatternsToTasks(positive: Pattern[], negative: Pattern[], dynamic: boolean): Task[];
export declare function getPositivePatterns(patterns: Pattern[]): Pattern[];
export declare function getNegativePatternsAsPositive(patterns: Pattern[], ignore: Pattern[]): Pattern[];
export declare function groupPatternsByBaseDirectory(patterns: Pattern[]): PatternsGroup;
export declare function convertPatternGroupsToTasks(positive: PatternsGroup, negative: Pattern[], dynamic: boolean): Task[];
export declare function convertPatternGroupToTask(base: string, positive: Pattern[], negative: Pattern[], dynamic: boolean): Task;
