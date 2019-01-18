import { IProductConfiguration } from "vs/platform/node/product";

const product = {
	nameShort: "VSCode",
	nameLong: "vscode online",
	dataFolderName: ".vscode-online",
	extensionsGallery: {
		serviceUrl: "",
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
