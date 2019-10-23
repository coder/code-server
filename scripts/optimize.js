// This must be ran from VS Code's root.
const gulp = require("gulp");
const path = require("path");
const _ = require("underscore");
const buildfile = require("./src/buildfile");
const common = require("./build/lib/optimize");
const util = require("./build/lib/util");
const deps = require("./build/dependencies");

const vscodeEntryPoints = _.flatten([
	buildfile.entrypoint("vs/workbench/workbench.web.api"),
	buildfile.entrypoint("vs/server/src/node/cli"),
	buildfile.base,
	buildfile.workbenchWeb,
	buildfile.workerExtensionHost,
	buildfile.keyboardMaps,
	buildfile.entrypoint('vs/platform/files/node/watcher/unix/watcherApp', ["vs/css", "vs/nls"]),
	buildfile.entrypoint('vs/platform/files/node/watcher/nsfw/watcherApp', ["vs/css", "vs/nls"]),
	buildfile.entrypoint('vs/workbench/services/extensions/node/extensionHostProcess', ["vs/css", "vs/nls"]),
]);

const vscodeResources = [
	"out-build/vs/server/main.js",
	"out-build/vs/server/src/node/uriTransformer.js",
	"!out-build/vs/server/doc/**",
	"out-build/vs/server/src/media/*",
	"out-build/vs/workbench/services/extensions/worker/extensionHostWorkerMain.js",
	"out-build/bootstrap.js",
	"out-build/bootstrap-fork.js",
	"out-build/bootstrap-amd.js",
	"out-build/paths.js",
	'out-build/vs/**/*.{svg,png,html}',
	"!out-build/vs/code/browser/workbench/*.html",
	'!out-build/vs/code/electron-browser/**',
	"out-build/vs/base/common/performance.js",
	"out-build/vs/base/node/languagePacks.js",
	"out-build/vs/base/browser/ui/octiconLabel/octicons/**",
	"out-build/vs/base/browser/ui/codiconLabel/codicon/**",
	"out-build/vs/workbench/browser/media/*-theme.css",
	"out-build/vs/workbench/contrib/debug/**/*.json",
	"out-build/vs/workbench/contrib/externalTerminal/**/*.scpt",
	"out-build/vs/workbench/contrib/webview/browser/pre/*.js",
	"out-build/vs/**/markdown.css",
	"out-build/vs/workbench/contrib/tasks/**/*.json",
	"out-build/vs/platform/files/**/*.md",
	"!**/test/**"
];

const rootPath = __dirname;
const nodeModules = ["electron", "original-fs"]
	.concat(_.uniq(deps.getProductionDependencies(rootPath).map((d) => d.name)))
	.concat(_.uniq(deps.getProductionDependencies(path.join(rootPath, "src/vs/server")).map((d) => d.name)))
	.concat(Object.keys(process.binding("natives")).filter((n) => !/^_|\//.test(n)));

gulp.task("optimize", gulp.series(
	util.rimraf("out-vscode"),
	common.optimizeTask({
		src: "out-build",
		entryPoints: vscodeEntryPoints,
		resources: vscodeResources,
		loaderConfig: common.loaderConfig(nodeModules),
		out: "out-vscode",
		inlineAmdImages: true,
		bundleInfo: undefined
	}),
));

gulp.task("minify", gulp.series(
	util.rimraf("out-vscode-min"),
	common.minifyTask("out-vscode")
));
