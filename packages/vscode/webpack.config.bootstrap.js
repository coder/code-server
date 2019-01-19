const path = require("path");
const webpack = require("webpack");

const root = path.resolve(__dirname, "..", "..");
const fills = path.join(root, "packages", "ide", "src", "fill");
const vscodeFills = path.join(root, "packages", "vscode", "src", "fill");

const merge = require("webpack-merge");

module.exports = (env) => {
	const afterCompileCommand = env && env.afterCompileCommand;
	return merge(require(path.join(root, "scripts", "webpack.general.config.js"))({
		typescriptCompilerOptions: {
			target: "es5",
		},
	}), {
		entry: path.join(root, "lib/vscode/src/bootstrap-fork.js"),
		mode: "development",
		target: "node",
		externals: ["node-pty", "spdlog"],
		output: {
			chunkFilename: "[name].bundle.js",
			path: path.resolve(__dirname, "./bin"),
			publicPath: "/",
			filename: "bootstrap-fork.js",
			libraryTarget: "commonjs",
			globalObject: "this",
		},
		module: {
			rules: [{
				loader: "string-replace-loader",
				test: /\.(js|ts)$/,
				options: {
					multiple: [
						{
							search: "require\\.toUrl\\(",
							replace: "requireToUrl(",
							flags: "g",
						},
						{
							search: "require\\.__\\$__nodeRequire",
							replace: "require",
							flags: "g",
						},
					],
				},
			}, {
				test: /\.wasm$/,
				type: "javascript/auto",
			}, {
				// Ignore a bunch of file types we don't have loaders for. Also ignore
				// test directories, some files with invalid JSON, and files we don't
				// actually require but throw warnings or errors. This all seems to be a
				// case of dynamic loading including things we won't require.
				// This also results in the bundle being significantly smaller which
				// makes uglify much faster.
				test: /(\/vs\/code\/electron-main\/)|(\/test\/)|(OSSREADME\.json$)|(\.(test\.ts|test\.js|d\.ts|qwoff|node|html|txt|exe|wuff|md|sh|scpt|less)$)/,
				use: ["ignore-loader"]
			}],
		},
		resolve: {
			alias: {
				"gc-signals": path.join(fills, "empty.ts"),
				"native-keymap": path.join(fills, "native-keymap.ts"),
				"windows-process-tree": path.resolve(fills, "empty.ts"),

				"electron": path.join(vscodeFills, "stdioElectron.ts"),
				"vs/platform/node/product": path.resolve(vscodeFills, "product.ts"),
				"vs/platform/node/package": path.resolve(vscodeFills, "package.ts"),
				"vs/base/node/paths": path.resolve(vscodeFills, "paths.ts"),
				"vs/base/common/amd": path.resolve(vscodeFills, "amd.ts"),
				"vs": path.resolve(root, "lib/vscode/src/vs"),
			},
		},
		resolveLoader: {
			alias: {
				"vs/css": path.resolve(vscodeFills, "css.js"),
			},
		},
		plugins: [
			new webpack.ProgressPlugin((percentage, msg) => {
				if (percentage === 1) {
					if (afterCompileCommand) {
						require("child_process").execSync(afterCompileCommand, {
							stdio: "inherit"
						});
					}
				}
			}),
		],
	});
};
