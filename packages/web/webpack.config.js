const path = require("path");
const merge = require("webpack-merge");

const root = path.resolve(__dirname, "../..");
const fills = path.join(root, "packages/ide/src/fill");
const vsFills = path.join(root, "packages/vscode/src/fill");

module.exports = merge(
	require(path.join(root, "scripts/webpack.client.config.js"))({
		dirname: __dirname,
		entry: path.join(root, "packages/web/src/index.ts"),
		name: "ide",
		template: path.join(root, "packages/web/src/index.html"),
		typescriptCompilerOptions: {
			"target": "es5",
			"lib": ["dom", "esnext"],
		},
	},
), {
	node: {
		module: "empty",
		crypto: "empty",
		tls: "empty",
	},
	resolve: {
		alias: {
			"gc-signals": path.join(fills, "empty.ts"),
			"selenium-webdriver": path.join(fills, "empty.ts"),
			"vscode": path.join(fills, "empty.ts"),
			"vscode-fsevents": path.join(fills, "empty.ts"),
			"vscode-windows-registry": path.resolve(fills, "empty.ts"),
			"vsda": path.join(fills, "empty.ts"),
			"windows-foreground-love": path.join(fills, "empty.ts"),
			"windows-mutex": path.join(fills, "empty.ts"),
			"windows-process-tree": path.join(fills, "empty.ts"),
			"vscode-sqlite3": path.join(fills, "empty.ts"),
			"tls": path.join(fills, "empty.ts"),
			"native-is-elevated": path.join(fills, "empty.ts"),
			"dns": path.join(fills, "empty.ts"),
			"console": path.join(fills, "empty.ts"),
			"readline": path.join(fills, "empty.ts"),
			"oniguruma": path.join(fills, "empty.ts"),

			// Webpack includes path-browserify but not the latest version, so
			// path.posix and path.parse are undefined (among other things possibly).
			// Also if we don't provide the full path, the code in vscode will import
			// from vscode's node_modules which is the wrong version.
			"path": path.join(fills, "path.js"),
			"crypto": "crypto-browserify",
			"http": "http-browserify",

			"child_process": path.join(fills, "child_process.ts"),
			"os": path.join(fills, "os.ts"),
			"fs": path.join(fills, "fs.ts"),
			"net": path.join(fills, "net.ts"),
			"util": path.join(fills, "util.ts"),
			"trash": path.join(fills, "trash.ts"),
			"electron": path.join(fills, "electron.ts"),

			"native-keymap": path.join(vsFills, "native-keymap.ts"),
			"node-pty": path.join(vsFills, "node-pty.ts"),
			"graceful-fs": path.join(vsFills, "graceful-fs.ts"),
			"spdlog": path.join(vsFills, "spdlog.ts"),
			"native-watchdog": path.join(vsFills, "native-watchdog.ts"),
			"iconv-lite": path.join(vsFills, "iconv-lite.ts"),

			// This seems to be in the wrong place?
			"vs/workbench/contrib/codeEditor/electron-browser/media/WordWrap_16x.svg": "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/WordWrap_16x.svg",

			"vs/platform/windows/electron-browser/windowsService": path.join(vsFills, "windowsService.ts"),
			"vs/base/node/paths": path.join(vsFills, "paths.ts"),
			"vs/base/common/amd": path.join(vsFills, "amd.ts"),
			"vs/platform/product/node/package": path.resolve(vsFills, "package.ts"),
			"vs/platform/product/node/product": path.resolve(vsFills, "product.ts"),
			"vs/base/node/zip": path.resolve(vsFills, "zip.ts"),
			"vszip": path.resolve(root, "lib/vscode/src/vs/base/node/zip.ts"),
			"vs": path.join(root, "lib", "vscode", "src", "vs"),
		},
	},
	resolveLoader: {
		alias: {
			"vs/css": path.join(vsFills, "css.js"),
		},
	},
});
