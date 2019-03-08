import { IProductConfiguration } from "vs/platform/product/node/product";

const product = {
	nameShort: "code-server",
	nameLong: "code-server",
	dataFolderName: ".code-server",
	extensionsGallery: {
		serviceUrl: global && global.process && global.process.env.SERVICE_URL
			|| process.env.SERVICE_URL
			|| "https://v1.extapi.coder.com",
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
