import { InitData } from "@coder/protocol";
import { IProductConfiguration } from "vs/platform/product/node/product";

class Product implements IProductConfiguration {
	public nameShort = "code-server";
	public nameLong = "code-server";

	private _dataFolderName: string | undefined;
	public get dataFolderName(): string {
		if (!this._dataFolderName) {
			throw new Error("trying to access data folder name before it has been set");
		}

		return this._dataFolderName;
	}

	public extensionsGallery = {
		serviceUrl: global && global.process && global.process.env.SERVICE_URL
			|| process.env.SERVICE_URL
			|| "https://v1.extapi.coder.com",
	};

	public extensionExecutionEnvironments = {
		"wayou.vscode-todo-highlight": "worker",
		"vscodevim.vim": "worker",
		"coenraads.bracket-pair-colorizer": "worker",
	};

	public fetchUrl = "";

	public initialize(_data: InitData): void {
		// Nothing at the moment; dataFolderName isn't used since we override the
		// extension path.
	}
}

export default new Product();
