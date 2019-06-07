import { OperatingSystem, InitData } from "@coder/protocol";
import { client } from "./client";

class OS {
	private _homedir: string | undefined;
	private _tmpdir: string | undefined;
	private _platform: NodeJS.Platform | undefined;

	public constructor() {
		client.initData.then((d) => this.initialize(d));
	}

	public homedir(): string {
		if (typeof this._homedir === "undefined") {
			throw new Error("trying to access homedir before it has been set");
		}

		return this._homedir;
	}

	public tmpdir(): string {
		if (typeof this._tmpdir === "undefined") {
			throw new Error("trying to access tmpdir before it has been set");
		}

		return this._tmpdir;
	}

	public initialize(data: InitData): void {
		this._homedir = data.homeDirectory;
		this._tmpdir = data.tmpDirectory;
		switch (data.os) {
			case OperatingSystem.Windows: this._platform = "win32"; break;
			case OperatingSystem.Mac: this._platform = "darwin"; break;
			default: this._platform = "linux"; break;
		}
		process.platform = this._platform;
		process.env = {};
		data.env.forEach((v, k) => {
			process.env[k] = v;
		});
	}

	public release(): string {
		return "Unknown";
	}

	public platform(): NodeJS.Platform {
		if (typeof this._platform === "undefined") {
			throw new Error("trying to access platform before it has been set");
		}

		return this._platform;
	}
}

export = new OS();
