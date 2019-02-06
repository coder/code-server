import { exec } from "child_process";
import { promisify } from "util";
import { appendFile, stat, readdir } from "fs";
import { RotatingLogger as NodeRotatingLogger } from "spdlog";
import { logger, field } from "@coder/logger";
import { escapePath } from "@coder/protocol";

// TODO: It would be better to spawn an actual spdlog instance on the server and
// use that for the logging. Or maybe create an instance when the server starts,
// and just always use that one (make it part of the protocol).
export class RotatingLogger implements NodeRotatingLogger {
	private format = true;
	private buffer = "";
	private flushPromise: Promise<void> | undefined;
	private name: string;
	private logDirectory: string;
	private escapedLogDirectory: string;
	private fullFilePath: string;
	private fileName: string;
	private fileExt: string | undefined;
	private escapedFilePath: string;
	private filesize: number;
	private filecount: number;

	public constructor(name: string, filePath: string, filesize: number, filecount: number) {
		this.name = name;
		this.filesize = filesize;
		this.filecount = filecount;

		this.fullFilePath = filePath;
		const slashIndex = filePath.lastIndexOf("/");
		const dotIndex = filePath.lastIndexOf(".");
		this.logDirectory = slashIndex !== -1 ? filePath.substring(0, slashIndex) : "/";
		this.fileName = filePath.substring(slashIndex + 1, dotIndex !== -1 ? dotIndex : undefined);
		this.fileExt = dotIndex !== -1 ? filePath.substring(dotIndex + 1) : undefined;

		this.escapedLogDirectory = escapePath(this.logDirectory);
		this.escapedFilePath = escapePath(filePath);

		this.flushPromise = new Promise((resolve): void => {
			exec(`mkdir -p ${this.escapedLogDirectory}; touch ${this.escapedFilePath}`, async (error) => {
				if (!error) {
					try {
						await this.doFlush();
					} catch (e) {
						error = e;
					}
				}
				if (error) {
					logger.error(error.message, field("error", error));
				}
				this.flushPromise = undefined;
				resolve();
			});
		});
	}

	public trace(message: string): void {
		this.write("trace", message);
	}

	public debug(message: string): void {
		this.write("debug", message);
	}

	public info(message: string): void {
		this.write("info", message);
	}

	public warn(message: string): void {
		this.write("warn", message);
	}

	public error(message: string): void {
		this.write("error", message);
	}

	public critical(message: string): void {
		this.write("critical", message);
	}

	public setLevel(): void {
		// Should output everything.
	}

	public clearFormatters(): void {
		this.format = false;
	}

	/**
	 * Flushes the buffer. Only one process runs at a time to prevent race
	 * conditions.
	 */
	public flush(): Promise<void> {
		if (!this.flushPromise) {
			this.flushPromise = this.doFlush().then(() => {
				this.flushPromise = undefined;
			}).catch((error) => {
				this.flushPromise = undefined;
				logger.error(error.message, field("error", error));
			});
		}

		return this.flushPromise;
	}

	public drop(): void {
		this.buffer = "";
	}

	private pad(num: number, length: number = 2, prefix: string = "0"): string {
		const str = num.toString();

		return (length > str.length ? prefix.repeat(length - str.length) : "") + str;
	}

	private write(severity: string, message: string): void {
		if (this.format) {
			const date = new Date();
			const dateStr = `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`
				+ ` ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}:${this.pad(date.getSeconds())}.${this.pad(date.getMilliseconds(), 3)}`;
			this.buffer += `[${dateStr}] [${this.name}] [${severity}] `;
		}
		this.buffer += message;
		if (this.format) {
			this.buffer += "\n";
		}
		this.flush();
	}

	private async rotate(): Promise<void> {
		const stats = await promisify(stat)(this.fullFilePath);
		if (stats.size < this.filesize) {
			return;
		}

		const reExt = typeof this.fileExt !== "undefined" ? `\\.${this.fileExt}` : "";
		const re = new RegExp(`^${this.fileName}(?:\\.(\\d+))?${reExt}$`);
		const orderedFiles: string[] = [];
		(await promisify(readdir)(this.logDirectory)).forEach((file) => {
			const match = re.exec(file);
			if (match) {
				orderedFiles[typeof match[1] !== "undefined" ? parseInt(match[1], 10) : 0] = file;
			}
		});

		// Rename in reverse so we don't overwrite before renaming something.
		let count = 0;
		const command = orderedFiles.map((file) => {
			const fileExt = typeof this.fileExt !== "undefined" ? `.${this.fileExt}` : "";
			const newFile = `${this.logDirectory}/${this.fileName}.${++count}${fileExt}`;

			return count >= this.filecount
				? `rm ${escapePath(this.logDirectory + "/" + file)}`
				: `mv ${escapePath(this.logDirectory + "/" + file)} ${escapePath(newFile)}`;
		}).reverse().concat([
			`touch ${escapePath(this.fullFilePath)}`,
		]).join(";");

		await promisify(exec)(command);
	}

	/**
	 * Flushes the entire buffer, including anything added in the meantime, and
	 * rotates the log if necessary.
	 */
	private async doFlush(): Promise<void> {
		const writeBuffer = async (): Promise<void> => {
			const toWrite = this.buffer;
			this.buffer = "";

			await promisify(appendFile)(this.fullFilePath, toWrite);
		};

		while (this.buffer.length > 0) {
			await writeBuffer();
			await this.rotate();
		}
	}
}

export const setAsyncMode = (): void => {
	// Nothing to do.
};
