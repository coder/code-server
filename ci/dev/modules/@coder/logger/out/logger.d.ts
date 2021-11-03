export declare enum Level {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warning = 3,
    Error = 4
}
export declare class Field<T> {
    readonly identifier: string;
    readonly value: T;
    constructor(identifier: string, value: T);
    toJSON(): object;
}
export declare class Time {
    readonly expected: number;
    readonly ms: number;
    constructor(expected: number, ms: number);
}
export declare type Argument = any;
/**
 * `undefined` is allowed to make it easier to conditionally display a field.
 * For example: `error && field("error", error)`
 */
export declare type FieldArray = Array<Field<Argument> | undefined>;
/**
 * Functions can be used to remove the need to perform operations when the
 * logging level won't output the result anyway.
 */
export declare type LogCallback = () => [string, ...FieldArray];
export declare const time: (expected: number) => Time;
export declare const field: <T>(name: string, value: T) => Field<T>;
export declare type Extender = (msg: {
    message: string;
    level: Level;
    type: "trace" | "info" | "warn" | "debug" | "error";
    fields?: FieldArray;
    section?: string;
}) => void;
/**
 * Format and build a *single* log entry at a time.
 */
export declare abstract class Formatter {
    private readonly formatType;
    private readonly colors;
    private format;
    private args;
    private fields;
    private readonly minimumTagWidth;
    /**
     * formatType is used for the strings returned from style() and reset().
     */
    constructor(formatType?: string, colors?: boolean);
    /**
     * Add a tag.
     */
    tag(name: string, color: string): void;
    /**
     * Add a field or an argument. Arguments will display inline in the order they
     * were pushed. Fields will display differently based on the formatter. Fields
     * cannot have custom colors.
     */
    push(fields: Field<Argument>[]): void;
    push(arg: Argument, color?: string, weight?: string): void;
    /**
     * Write everything out and reset state.
     */
    write(): void;
    /**
     * Return current values and reset state.
     */
    protected flush(): [string, string[], Field<Argument>[]];
    /**
     * Return a string that applies the specified color and weight.
     */
    protected abstract style(color?: string, weight?: string): string;
    /**
     * Return a string that resets all styles.
     */
    protected abstract reset(): string;
    /**
     * Write everything out.
     */
    protected abstract doWrite(format: string, args: string[], fields: Field<Argument>[]): void;
    /**
     * Get the format string for the value type.
     */
    private getType;
}
/**
 * Display logs in the browser using CSS in the output. Fields are displayed on
 * individual lines within a group.
 */
export declare class BrowserFormatter extends Formatter {
    constructor();
    protected style(color?: string, weight?: string): string;
    protected reset(): string;
    doWrite(format: string, args: string[], fields: Array<Field<Argument>>): void;
}
/**
 * Display logs on the command line using ANSI color codes. Fields are displayed
 * in a single stringified object inline.
 */
export declare class ServerFormatter extends Formatter {
    constructor();
    protected style(color?: string, weight?: string): string;
    protected reset(): string;
    private hex;
    private hexToRgb;
    protected doWrite(format: string, args: string[], fields: Array<Field<Argument>>): void;
}
export declare class Logger {
    private _formatter;
    private readonly name?;
    private readonly defaultFields?;
    private readonly extenders;
    level: Level;
    private readonly nameColor?;
    private muted;
    constructor(_formatter: Formatter, name?: string | undefined, defaultFields?: (Field<any> | undefined)[] | undefined, extenders?: Extender[]);
    formatter: Formatter;
    /**
     * Supresses all output
     */
    mute(): void;
    extend(extender: Extender): void;
    info(fn: LogCallback): void;
    info(message: string, ...fields: FieldArray): void;
    warn(fn: LogCallback): void;
    warn(message: string, ...fields: FieldArray): void;
    trace(fn: LogCallback): void;
    trace(message: string, ...fields: FieldArray): void;
    debug(fn: LogCallback): void;
    debug(message: string, ...fields: FieldArray): void;
    error(fn: LogCallback): void;
    error(message: string, ...fields: FieldArray): void;
    /**
     * Returns a sub-logger with a name.
     * Each name is deterministically generated a color.
     */
    named(name: string, ...fields: FieldArray): Logger;
    private handle;
    /**
     * Hashes a string.
     */
    private djb2;
    private rgbToHex;
    /**
     * Generates a deterministic color from a string using hashing.
     */
    private hashStringToColor;
}
export declare const logger: Logger;
