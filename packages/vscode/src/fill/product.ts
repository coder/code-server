import { IProductConfiguration } from "vs/platform/node/product";

const product = {
	nameShort: "VSCode",
	nameLong: "vscode online",
	dataFolderName: ".vscode-online",
	extensionsGallery: {
		serviceUrl: "https://marketplace.visualstudio.com/_apis/public/gallery",
		cacheUrl: "https://vscode.blob.core.windows.net/gallery/index",
		itemUrl: "https://marketplace.visualstudio.com/items",
		controlUrl: "https://az764295.vo.msecnd.net/extensions/marketplace.json",
		recommendationsUrl: "https://az764295.vo.msecnd.net/extensions/workspaceRecommendations.json.gz",
	},
	extensionExecutionEnvironments: {
		"wayou.vscode-todo-highlight": "worker",
		"vscodevim.vim": "worker",
		"coenraads.bracket-pair-colorizer": "worker",
	},
	fetchUrl: "",
} as IProductConfiguration;

if (process.env['VSCODE_DEV']) {
	product.nameShort += ' Dev';
	product.nameLong += ' Dev';
	product.dataFolderName += '-dev';
}

export default product;
