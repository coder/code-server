/**
 * Log level.
 */
export enum Level {
	Trace,
	Debug,
	Info,
	Warning,
	Error,
}

/**
 * A field to log.
 */
export class Field<T> {
	public constructor(
		public readonly identifier: string,
		public readonly value: T,
	) { }

	/**
	 * Convert field to JSON.
	 */
	public toJSON(): object {
		return {
			identifier: this.identifier,
			value: this.value,
		};
	}
}

/**
 * Represents the time something takes.
 */
export class Time {
	public constructor(
		public readonly expected: number,
		public readonly ms: number,
	) { }
}

// `undefined` is allowed to make it easy to conditionally display a field.
// For example: `error && field("error", error)`
// tslint:disable-next-line no-any
export type FieldArray = Array<Field<any> | undefined>;

// Functions can be used to remove the need to perform operations when the
// logging level won't output the result anyway.
export type LogCallback = () => [string, ...FieldArray];

/**
 * Creates a time field
 */
export const time = (expected: number): Time => {
	return new Time(expected, Date.now());
};

export const field = <T>(name: string, value: T): Field<T> => {
	return new Field(name, value);
};

export type Extender = (msg: {
	message: string,
	level: Level,
	type: "trace" | "info" | "warn" | "debug" | "error",
	fields?: FieldArray,
	section?: string,
}) => void;

/**
 * This formats & builds text for logging.
 * It should only be used to build one log item at a time since it stores the
 * currently built items and appends to that.
 */
export abstract class Formatter {
	protected format = "";
	protected args = <string[]>[];

	/**
	 * Add a tag.
	 */
	public abstract tag(name: string, color: string): void;

	/**
	 * Add string or arbitrary variable.
	 */
	public abstract push(arg: string, color?: string, weight?: string): void;
	public abstract push(arg: any): void; // tslint:disable-line no-any

	// tslint:disable-next-line no-any
	public abstract fields(fields: Array<Field<any>>): void;

	/**
	 * Flush out the built arguments.
	 */
	public flush(): any[] { // tslint:disable-line no-any
		const args = [this.format, ...this.args];
		this.format = "";
		this.args = [];

		return args;
	}

	/**
	 * Get the format string for the value type.
	 */
	protected getType(arg: any): string { // tslint:disable-line no-any
		switch (typeof arg) {
			case "object":
				return "%o";
			case "number":
				return "%d";
			default:
				return "%s";
		}
	}
}

/**
 * Browser formatter.
 */
export class BrowserFormatter extends Formatter {
	public tag(name: string, color: string): void {
		this.format += `%c ${name} `;
		this.args.push(
			`border: 1px solid #222; background-color: ${color}; padding-top: 1px;`
			+ " padding-bottom: 1px; font-size: 12px; font-weight: bold; color: white;"
			+ (name.length === 4 ? "padding-left: 3px; padding-right: 4px;" : ""),
		);
		// A space to separate the tag from the title.
		this.push(" ");
	}

	public push(arg: any, color: string = "inherit", weight: string = "normal"): void { // tslint:disable-line no-any
		if (color || weight) {
			this.format += "%c";
			this.args.push(
				(color ? `color: ${color};` : "") +
				(weight ? `font-weight: ${weight};` : ""),
			);
		}
		this.format += this.getType(arg);
		this.args.push(arg);
	}

	// tslint:disable-next-line no-any
	public fields(fields: Array<Field<any>>): void {
		// tslint:disable-next-line no-console
		console.groupCollapsed(...this.flush());
		fields.forEach((field) => {
			this.push(field.identifier, "#3794ff", "bold");
			if (typeof field.value !== "undefined" && field.value.constructor && field.value.constructor.name) {
				this.push(` (${field.value.constructor.name})`);
			}
			this.push(": ");
			this.push(field.value);
			// tslint:disable-next-line no-console
			console.log(...this.flush());
		});
		// tslint:disable-next-line no-console
		console.groupEnd();
	}
}

/**
 * Server (Node) formatter.
 */
export class ServerFormatter extends Formatter {
	public tag(name: string, color: string): void {
		const [r, g, b] = this.hexToRgb(color);
		while (name.length < 5) {
			name += " ";
		}
		this.format += "\u001B[1m";
		this.format += `\u001B[38;2;${r};${g};${b}m${name} \u001B[0m`;
	}

	public push(arg: any, color?: string, weight?: string): void { // tslint:disable-line no-any
		if (weight === "bold") {
			this.format += "\u001B[1m";
		}
		if (color) {
			const [r, g, b] = this.hexToRgb(color);
			this.format += `\u001B[38;2;${r};${g};${b}m`;
		}
		this.format += this.getType(arg);
		if (weight || color) {
			this.format += "\u001B[0m";
		}
		this.args.push(arg);
	}

	// tslint:disable-next-line no-any
	public fields(fields: Array<Field<any>>): void {
		// tslint:disable-next-line no-any
		const obj: { [key: string]: any} = {};
		this.format += "\u001B[38;2;140;140;140m";
		fields.forEach((field) => {
			obj[field.identifier] = field.value;
		});
		this.args.push(JSON.stringify(obj));
		console.log(...this.flush()); // tslint:disable-line no-console
	}

	/**
	 * Convert fully-formed hex to rgb.
	 */
	private hexToRgb(hex: string): [number, number, number] {
		const integer = parseInt(hex.substr(1), 16);

		return [
			(integer >> 16) & 0xFF,
			(integer >> 8) & 0xFF,
			integer & 0xFF,
		];
	}
}

/**
 * Class for logging.
 */
export class Logger {
	public level = Level.Info;

	private readonly nameColor?: string;
	private muted: boolean = false;

	public constructor(
		private _formatter: Formatter,
		private readonly name?: string,
		private readonly defaultFields?: FieldArray,
		private readonly extenders: Extender[] = [],
	) {
		if (name) {
			this.nameColor = this.hashStringToColor(name);
		}
		const envLevel = typeof global !== "undefined" && typeof global.process !== "undefined" ? global.process.env.LOG_LEVEL : process.env.LOG_LEVEL;
		if (envLevel) {
			switch (envLevel) {
				case "trace": this.level = Level.Trace; break;
				case "debug": this.level = Level.Debug; break;
				case "info": this.level = Level.Info; break;
				case "warn": this.level = Level.Warning; break;
				case "error": this.level = Level.Error; break;
			}
		}
	}

	public set formatter(formatter: Formatter) {
		this._formatter = formatter;
	}

	/**
	 * Supresses all output
	 */
	public mute(): void {
		this.muted = true;
	}

	public extend(extender: Extender): void {
		this.extenders.push(extender);
	}

	/**
	 * Outputs information.
	 */
	public info(fn: LogCallback): void;
	public info(message: string, ...fields: FieldArray): void;
	public info(message: LogCallback | string, ...fields: FieldArray): void {
		this.handle({
			type: "info",
			message,
			fields,
			tagColor: "#008FBF",
			level: Level.Info,
		});
	}

	/**
	 * Outputs a warning.
	 */
	public warn(fn: LogCallback): void;
	public warn(message: string, ...fields: FieldArray): void;
	public warn(message: LogCallback | string, ...fields: FieldArray): void {
		this.handle({
			type: "warn",
			message,
			fields,
			tagColor: "#FF9D00",
			level: Level.Warning,
		});
	}

	/**
	 * Outputs a trace message.
	 */
	public trace(fn: LogCallback): void;
	public trace(message: string, ...fields: FieldArray): void;
	public trace(message: LogCallback | string, ...fields: FieldArray): void {
		this.handle({
			type: "trace",
			message,
			fields,
			tagColor: "#888888",
			level: Level.Trace,
		});
	}

	/**
	 * Outputs a debug message.
	 */
	public debug(fn: LogCallback): void;
	public debug(message: string, ...fields: FieldArray): void;
	public debug(message: LogCallback | string, ...fields: FieldArray): void {
		this.handle({
			type: "debug",
			message,
			fields,
			tagColor: "#84009E",
			level: Level.Debug,
		});
	}

	/**
	 * Outputs an error.
	 */
	public error(fn: LogCallback): void;
	public error(message: string, ...fields: FieldArray): void;
	public error(message: LogCallback | string, ...fields: FieldArray): void {
		this.handle({
			type: "error",
			message,
			fields,
			tagColor: "#B00000",
			level: Level.Error,
		});
	}

	/**
	 * Returns a sub-logger with a name.
	 * Each name is deterministically generated a color.
	 */
	public named(name: string, ...fields: FieldArray): Logger {
		const l = new Logger(this._formatter, name, fields, this.extenders);
		if (this.muted) {
			l.mute();
		}

		return l;
	}

	/**
	 * Outputs a message.
	 */
	private handle(options: {
		type: "trace" | "info" | "warn" | "debug" | "error";
		message: string | LogCallback;
		fields?: FieldArray;
		level: Level;
		tagColor: string;
	}): void {
		if (this.level > options.level || this.muted) {
			return;
		}

		let passedFields = options.fields || [];
		if (typeof options.message === "function") {
			const values = options.message();
			options.message = values.shift() as string;
			passedFields = values as FieldArray;
		}

		const fields = (this.defaultFields
			? passedFields.filter((f) => !!f).concat(this.defaultFields)
			: passedFields.filter((f) => !!f)) as Array<Field<any>>; // tslint:disable-line no-any

		const now = Date.now();
		let times: Array<Field<Time>> = [];
		const hasFields = fields && fields.length > 0;
		if (hasFields) {
			times = fields.filter((f) => f.value instanceof Time);
		}

		this._formatter.tag(options.type.toUpperCase(), options.tagColor);
		if (this.name && this.nameColor) {
			this._formatter.tag(this.name.toUpperCase(), this.nameColor);
		}
		this._formatter.push(options.message);
		if (times.length > 0) {
			times.forEach((time) => {
				const diff = now - time.value.ms;
				const expPer = diff / time.value.expected;
				const min = 125 * (1 - expPer);
				const max = 125 + min;
				const green = expPer < 1 ? max : min;
				const red = expPer >= 1 ? max : min;
				this._formatter.push(` ${time.identifier}=`, "#3794ff");
				this._formatter.push(`${diff}ms`, this.rgbToHex(red > 0 ? red : 0, green > 0 ? green : 0, 0));
			});
		}

		// tslint:disable no-console
		if (hasFields) {
			this._formatter.fields(fields);
		} else {
			console.log(...this._formatter.flush());
		}
		// tslint:enable no-console

		this.extenders.forEach((extender) => {
			extender({
				section: this.name,
				fields: options.fields,
				level: options.level,
				message: options.message as string,
				type: options.type,
			});
		});
	}

	/**
	 * Hashes a string.
	 */
	private djb2(str: string): number {
		let hash = 5381;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
		}

		return hash;
	}

	/**
	 * Convert rgb to hex.
	 */
	private rgbToHex(r: number, g: number, b: number): string {
		const integer = ((Math.round(r) & 0xFF) << 16)
			+ ((Math.round(g) & 0xFF) << 8)
			+ (Math.round(b) & 0xFF);

		const str = integer.toString(16);

		return "#" + "000000".substring(str.length) + str;
	}

	/**
	 * Generates a deterministic color from a string using hashing.
	 */
	private hashStringToColor(str: string): string {
		const hash = this.djb2(str);

		return this.rgbToHex(
			(hash & 0xFF0000) >> 16,
			(hash & 0x00FF00) >> 8,
			hash & 0x0000FF,
		);
	}
}

export const logger = new Logger(
	typeof process === "undefined" || typeof process.stdout === "undefined"
		? new BrowserFormatter()
		: new ServerFormatter(),
);
