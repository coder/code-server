import { register, run } from "@coder/runner";
import * as fs from "fs";
import * as fse from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as zlib from "zlib";
import * as https from "https";
import * as tar from "tar";

const isWin = os.platform() === "win32";
const libPath = path.join(__dirname, "../lib");
const vscodePath = path.join(libPath, "vscode");
const defaultExtensionsPath = path.join(libPath, "extensions");
const pkgsPath = path.join(__dirname, "../packages");
const vscodeVersion = process.env.VSCODE_VERSION || "1.33.1";
const vsSourceUrl = `https://codesrv-ci.cdr.sh/vstar-${vscodeVersion}.tar.gz`;

const buildServerBinary = register("build:server:binary", async (runner) => {
	await ensureInstalled();
	await Promise.all([
		buildBootstrapFork(),
		buildWeb(),
		buildServerBundle(),
		buildAppBrowser(),
	]);

	await buildServerBinaryPackage();
});

const buildServerBinaryPackage = register("build:server:binary:package", async (runner) => {
	const cliPath = path.join(pkgsPath, "server");
	runner.cwd = cliPath;
	if (!fs.existsSync(path.join(cliPath, "out"))) {
		throw new Error("Cannot build binary without server bundle built");
	}
	await buildServerBinaryCopy();
	const resp = await runner.execute(isWin ? "npm.cmd" : "npm", ["run", "build:binary"]);
	if (resp.exitCode !== 0) {
		throw new Error(`Failed to package binary: ${resp.stderr}`);
	}
});

const buildServerBinaryCopy = register("build:server:binary:copy", async (runner) => {
	const cliPath = path.join(pkgsPath, "server");
	const cliBuildPath = path.join(cliPath, "build");
	fse.removeSync(cliBuildPath);
	fse.mkdirpSync(path.join(cliBuildPath, "extensions"));
	const bootstrapForkPath = path.join(pkgsPath, "vscode", "out", "bootstrap-fork.js");
	const webOutputPath = path.join(pkgsPath, "web", "out");
	const browserAppOutputPath = path.join(pkgsPath, "app", "browser", "out");
	let ripgrepPath = path.join(pkgsPath, "..", "lib", "vscode", "node_modules", "vscode-ripgrep", "bin", "rg");
	if (isWin) {
		ripgrepPath += ".exe";
	}

	if (!fs.existsSync(webOutputPath)) {
		throw new Error("Web bundle must be built");
	}
	if (!fs.existsSync(defaultExtensionsPath)) {
		throw new Error("Default extensions must be built");
	}
	if (!fs.existsSync(bootstrapForkPath)) {
		throw new Error("Bootstrap fork must exist");
	}
	if (!fs.existsSync(ripgrepPath)) {
		throw new Error("Ripgrep must exist");
	}
	fse.copySync(defaultExtensionsPath, path.join(cliBuildPath, "extensions"));
	fs.writeFileSync(path.join(cliBuildPath, "bootstrap-fork.js.gz"), zlib.gzipSync(fs.readFileSync(bootstrapForkPath)));
	const cpDir = (dir: string, rootPath: string, subdir?: "login"): void => {
		const stat = fs.statSync(dir);
		if (stat.isDirectory()) {
			const paths = fs.readdirSync(dir);
			paths.forEach((p) => cpDir(path.join(dir, p), rootPath, subdir));
		} else if (stat.isFile()) {
			const newPath = path.join(cliBuildPath, "web", subdir || "", path.relative(rootPath, dir));
			fse.mkdirpSync(path.dirname(newPath));
			fs.writeFileSync(newPath + ".gz", zlib.gzipSync(fs.readFileSync(dir)));
		} else {
			// Nothing
		}
	};
	cpDir(webOutputPath, webOutputPath);
	cpDir(browserAppOutputPath, browserAppOutputPath, "login");
	fse.mkdirpSync(path.join(cliBuildPath, "dependencies"));
	fse.copySync(ripgrepPath, path.join(cliBuildPath, "dependencies", "rg"));
});

const buildServerBundle = register("build:server:bundle", async (runner) => {
	const cliPath = path.join(pkgsPath, "server");
	runner.cwd = cliPath;
	await runner.execute(isWin ? "npm.cmd" : "npm", ["run", "build"]);
});

const buildBootstrapFork = register("build:bootstrap-fork", async (runner) => {
	await ensureInstalled();
	await ensurePatched();

	const vscodePkgPath = path.join(pkgsPath, "vscode");
	runner.cwd = vscodePkgPath;
	await runner.execute(isWin ? "npm.cmd" : "npm", ["run", "build:bootstrap-fork"]);
});

const buildAppBrowser = register("build:app:browser", async (runner) => {
	await ensureInstalled();

	const appPath = path.join(pkgsPath, "app/browser");
	runner.cwd = appPath;
	fse.removeSync(path.join(appPath, "out"));
	await runner.execute(isWin ? "npm.cmd" : "npm", ["run", "build"]);
});

const buildWeb = register("build:web", async (runner) => {
	await ensureInstalled();
	await ensurePatched();

	const webPath = path.join(pkgsPath, "web");
	runner.cwd = webPath;
	fse.removeSync(path.join(webPath, "out"));
	await runner.execute(isWin ? "npm.cmd" : "npm", ["run", "build"]);
});

const ensureInstalled = register("vscode:install", async (runner) => {
	runner.cwd = libPath;

	if (fs.existsSync(vscodePath) && fs.existsSync(defaultExtensionsPath)) {
		const pkgVersion = JSON.parse(fs.readFileSync(path.join(vscodePath, "package.json")).toString("utf8")).version;
		if (pkgVersion === vscodeVersion) {
			runner.cwd = vscodePath;

			const reset = await runner.execute("git", ["reset", "--hard"]);
			if (reset.exitCode !== 0) {
				throw new Error(`Failed to clean git repository: ${reset.stderr}`);
			}

			return;
		}
	}

	fse.removeSync(libPath);
	fse.mkdirpSync(libPath);

	await new Promise<void>((resolve, reject): void => {
		https.get(vsSourceUrl, (res) => {
			if (res.statusCode !== 200) {
				return reject(res.statusMessage);
			}

			res.pipe(tar.x({
				C: libPath,
			}).on("finish", () => {
				resolve();
			}).on("error", (err: Error) => {
				reject(err);
			}));
		}).on("error", (err) => {
			reject(err);
		});
	});
});

const ensurePatched = register("vscode:patch", async (runner) => {
	if (!fs.existsSync(vscodePath)) {
		throw new Error("vscode must be cloned to patch");
	}
	await ensureInstalled();

	runner.cwd = vscodePath;
	const patchPath = path.join(__dirname, "../scripts/vscode.patch");
	const apply = await runner.execute("git", ["apply", "--unidiff-zero", patchPath]);
	if (apply.exitCode !== 0) {
		throw new Error(`Failed to apply patches: ${apply.stderr}`);
	}
});

register("package", async (runner, releaseTag) => {
	if (!releaseTag) {
		throw new Error("Please specify the release tag.");
	}

	const releasePath = path.resolve(__dirname, "../release");

	const archiveName = `code-server${releaseTag}-${os.platform()}-${os.arch()}`;
	const archiveDir = path.join(releasePath, archiveName);
	fse.removeSync(archiveDir);
	fse.mkdirpSync(archiveDir);

	const binaryPath = path.join(__dirname, `../packages/server/cli-${os.platform()}-${os.arch()}`);
	const binaryDestination = path.join(archiveDir, "code-server");
	fse.copySync(binaryPath, binaryDestination);
	fs.chmodSync(binaryDestination, "755");
	["README.md", "LICENSE"].forEach((fileName) => {
		fse.copySync(path.resolve(__dirname, `../${fileName}`), path.join(archiveDir, fileName));
	});

	runner.cwd = releasePath;
	await (os.platform() === "linux"
		? runner.execute("tar", ["-cvzf", `${archiveName}.tar.gz`, `${archiveName}`])
		: runner.execute("zip", ["-r", `${archiveName}.zip`, `${archiveName}`]));
});

run();
