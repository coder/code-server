const path = require("path");
const merge = require("webpack-merge");

const root = path.resolve(__dirname, "../..");
const fills = path.join(root, "packages/ide/src/fill");
const vsFills = path.join(root, "packages/vscode/src/fill");

module.exports = merge(
	require(path.join(root, "scripts/webpack.node.config.js"))({
		dirname: __dirname,
		typescriptCompilerOptions: {
			target: "es6",
		},
	}), {
		entry: path.join(root, "lib/vscode/src/bootstrap-fork.js"),
		mode: "development",
		output: {
			chunkFilename: "[name].bundle.js",
			publicPath: "/",
			filename: "bootstrap-fork.js",
			libraryTarget: "commonjs",
			globalObject: "this",
		},
		// Due to the dynamic `require.context` we add to `loader.js` Webpack tries
		// to include way too much. We can modify what Webpack imports in this case
		// (I believe), but for now ignore some things.
		module: {
			rules: [{
				test: /\.(txt|d\.ts|perf\.data\.js|jxs|scpt|exe|sh|less|html|s?css|qwoff|md|svg|png|ttf|woff|eot|woff2)$/,
				use: [{
					loader: "ignore-loader",
				}],
			}, {
				test: /test|tsconfig/,
				use: [{
					loader: "ignore-loader",
				}],
			}, {
				// The only thing we need in electron-browser is the shared process (including contrib).
				test: /((\\|\/)vs(\\|\/)code(\\|\/)electron-main(\\|\/))|((\\|\/)test(\\|\/))|(OSSREADME\.json$)|\/browser\/|\/electron-browser\/(?!sharedProcess\/).+\//,
				use: [{
					loader: "ignore-loader",
				}],
			}],
			noParse: /(\\|\/)test(\\|\/)|\.test\.jsx?|\.test\.tsx?|tsconfig.+\.json$/,
		},
		resolve: {
			alias: {
				"gc-signals": path.join(fills, "empty.ts"),
				"node-pty": path.resolve(fills, "empty.ts"),
				"windows-mutex": path.resolve(fills, "empty.ts"),
				"windows-process-tree": path.resolve(fills, "empty.ts"),
				"vscode-windows-registry": path.resolve(fills, "empty.ts"),
				"vscode-windows-ca-certs": path.resolve(fills, "empty.ts"),
				"vscode-sqlite3": path.resolve(fills, "empty.ts"),
				"vs/base/browser/browser": path.resolve(fills, "empty.ts"),

				"applicationinsights": path.join(vsFills, "applicationInsights.ts"),
				"electron": path.join(vsFills, "stdioElectron.ts"),
				"vscode-ripgrep": path.join(vsFills, "ripgrep.ts"),
				"native-keymap": path.join(vsFills, "native-keymap.ts"),
				"native-watchdog": path.join(vsFills, "native-watchdog.ts"),
				"vs/base/common/amd": path.resolve(vsFills, "amd.ts"),
				"vs/base/node/paths": path.join(vsFills, "paths.ts"),
				"vs/platform/product/node/package": path.resolve(vsFills, "package.ts"),
				"vs/platform/product/node/product": path.resolve(vsFills, "product.ts"),
				"vs/base/node/zip": path.resolve(vsFills, "zip.ts"),
				"vszip": path.resolve(root, "lib/vscode/src/vs/base/node/zip.ts"),
				"vs": path.resolve(root, "lib/vscode/src/vs"),
			},
		},
		resolveLoader: {
			alias: {
				"vs/css": path.resolve(vsFills, "css.js"),
			},
		},
	}
);
