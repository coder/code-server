import { InitData } from "@coder/protocol";
import { client } from "./client";

class OS {
	private _homedir: string | undefined;
	private _tmpdir: string | undefined;

	public constructor() {
		client.initData.then((data) => {
			this.initialize(data);
		});
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
	}

	public platform(): NodeJS.Platform {
		if (navigator.appVersion.indexOf("Win") != -1) {
			return "win32";
		}
		if (navigator.appVersion.indexOf("Mac") != -1) {
			return "darwin";
		}

		return "linux";
	}
}

export = new OS();
