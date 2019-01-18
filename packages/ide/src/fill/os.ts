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
			throw new Error("not initialized");
		}

		return this._homedir;
	}

	public tmpdir(): string {
		if (typeof this._tmpdir === "undefined") {
			throw new Error("not initialized");
		}

		return this._tmpdir;
	}

	public initialize(data: InitData): void {
		this._homedir = data.homeDirectory;
		this._tmpdir = data.tmpDirectory;
	}

}

export = new OS();
