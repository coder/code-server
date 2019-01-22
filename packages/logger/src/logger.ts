/**
 * Log level.
 */
export enum Level {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
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

export type FieldArray = Array<Field<any>>; // tslint:disable-line no-any

/**
 * Creates a time field
 */
export const time = (expected: number): Time => {
	return new Time(expected, Date.now());
};

export const field = <T>(name: string, value: T): Field<T> => {
	return new Field(name, value);
};

/**
 * Hashes a string.
 */
const djb2 = (str: string): number => {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
	}

	return hash;
};

/**
 * Convert rgb to hex.
 */
const rgbToHex = (r: number, g: number, b: number): string => {
	const integer = ((Math.round(r) & 0xFF) << 16)
		+ ((Math.round(g) & 0xFF) << 8)
		+ (Math.round(b) & 0xFF);

	const str = integer.toString(16);

	return "#" + "000000".substring(str.length) + str;
};

/**
 * Convert fully-formed hex to rgb.
 */
const hexToRgb = (hex: string): [number, number, number] => {
	const integer = parseInt(hex.substr(1), 16);

	return [
		(integer >> 16) & 0xFF,
		(integer >> 8) & 0xFF,
		integer & 0xFF,
	];
};

/**
 * Generates a deterministic color from a string using hashing.
 */
const hashStringToColor = (str: string): string => {
	const hash = djb2(str);

	return rgbToHex(
		(hash & 0xFF0000) >> 16,
		(hash & 0x00FF00) >> 8,
		hash & 0x0000FF,
	);
};

/**
 * This formats & builds text for logging.
 * It should only be used to build one log item at a time since it stores the
 * currently built items and appends to that.
 */
export abstract class Formatter {

	protected format: string = "";
	protected args: string[] = [];

	/**
	 * Add a tag.
	 */
	public abstract tag(name: string, color: string): void;

	/**
	 * Add string or arbitrary variable.
	 */
	public abstract push(arg: string, color?: string, weight?: string): void;
	public abstract push(arg: any): void; // tslint:disable-line no-any

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

	public fields(fields: Array<Field<any>>): void {
		console.groupCollapsed(...this.flush());
		fields.forEach((field) => {
			this.push(field.identifier, "#3794ff", "bold");
			if (typeof field.value !== "undefined" && field.value.constructor && field.value.constructor.name) {
				this.push(` (${field.value.constructor.name})`);
			}
			this.push(": ");
			this.push(field.value);
			console.log(...this.flush());
		});
		console.groupEnd();
	}

}

/**
 * Server (Node) formatter.
 */
export class ServerFormatter extends Formatter {

	public tag(name: string, color: string): void {
		const [r, g, b] = hexToRgb(color);
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
			const [r, g, b] = hexToRgb(color);
			this.format += `\u001B[38;2;${r};${g};${b}m`;
		}
		this.format += this.getType(arg);
		if (weight || color) {
			this.format += "\u001B[0m";
		}
		this.args.push(arg);
	}

	public fields(fields: Array<Field<any>>): void {
		const obj = {} as any;
		this.format += "\u001B[38;2;140;140;140m";
		fields.forEach((field) => {
			obj[field.identifier] = field.value;
		});
		this.args.push(JSON.stringify(obj));
		console.log(...this.flush()); // tslint:disable-line no-console
	}

}

/**
 * Class for logging.
 */
export class Logger {

	public level = Level.Info;

	private readonly nameColor?: string;
	private muted: boolean;

	public constructor(
		private _formatter: Formatter,
		private readonly name?: string,
		private readonly defaultFields?: FieldArray,
	) {
		this.muted = false;
		if (name) {
			this.nameColor = hashStringToColor(name);
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

	/**
	 * Outputs information.
	 */
	public info(msg: string, ...fields: FieldArray): void {
		if (this.level <= Level.Info) {
			this.handle({
				type: "info",
				message: msg,
				fields,
				tagColor: "#008FBF",
			});
		}
	}

	/**
	 * Outputs a warning.
	 */
	public warn(msg: string, ...fields: FieldArray): void {
		if (this.level <= Level.Warn) {
			this.handle({
				type: "warn",
				message: msg,
				fields,
				tagColor: "#FF9D00",
			});
		}
	}

	/**
	 * Outputs a debug message.
	 */
	public debug(msg: string, ...fields: FieldArray): void {
		if (this.level <= Level.Debug) {
			this.handle({
				type: "debug",
				message: msg,
				fields,
				tagColor: "#84009E",
			});
		}
	}

	/**
	 * Outputs an error.
	 */
	public error(msg: string, ...fields: FieldArray): void {
		if (this.level <= Level.Error) {
			this.handle({
				type: "error",
				message: msg,
				fields,
				tagColor: "#B00000",
			});
		}
	}

	/**
	 * Returns a sub-logger with a name.
	 * Each name is deterministically generated a color.
	 */
	public named(name: string, ...fields: FieldArray): Logger {
		const l = new Logger(this._formatter, name, fields);
		l.level = this.level;
		if (this.muted) {
			l.mute();
		}

		return l;
	}

	/**
	 * Outputs a message.
	 */
	private handle(options: {
		type: "info" | "warn" | "debug" | "error";
		message: string;
		fields?: FieldArray;
		tagColor: string;
	}): void {
		if (this.muted) {
			return;
		}

		const passedFields = options.fields || [];
		const fields = this.defaultFields
			? passedFields.concat(this.defaultFields)
			: passedFields;

		const now = Date.now();
		let times: Array<Field<Time>> = [];
		const hasFields = fields && fields.length > 0;
		if (hasFields) {
			times = fields.filter((f) => f.value instanceof Time);
		}

		// Format is:
		// [TAG] [NAME?] MESSAGE TIME?
		//   field1 (type)?: value
		//   field2 (type)?: value
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
				this._formatter.push(`${diff}ms`, rgbToHex(red > 0 ? red : 0, green > 0 ? green : 0, 0));
			});
		}

		// tslint:disable no-console
		if (hasFields) {
			this._formatter.fields(fields);
		} else {
			console.log(...this._formatter.flush());
		}
		// tslint:enable no-console
	}

}

export const logger = new Logger(
	typeof process === "undefined" || typeof process.stdout === "undefined"
		? new BrowserFormatter()
		: new ServerFormatter(),
);
