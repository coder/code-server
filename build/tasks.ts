import { register, run } from "@coder/runner";
import * as fs from "fs";
import * as fse from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as zlib from "zlib";

const isWin = os.platform() === "win32";
const libPath = path.join(__dirname, "../lib");
const vscodePath = path.join(libPath, "vscode");
const pkgsPath = path.join(__dirname, "../packages");
const defaultExtensionsPath = path.join(libPath, "VSCode-linux-x64/resources/app/extensions");
const vscodeVersion = process.env.VSCODE_VERSION || "1.32.0";

const buildServerBinary = register("build:server:binary", async (runner) => {
	await ensureInstalled();
	await copyForDefaultExtensions();
	await Promise.all([
		buildBootstrapFork(),
		buildWeb(),
		buildDefaultExtensions(),
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
	const nodePtyModule = path.join(pkgsPath, "protocol", "node_modules", "node-pty-prebuilt", "build", "Release", "pty.node");
	const spdlogModule = path.join(pkgsPath, "protocol", "node_modules", "spdlog", "build", "Release", "spdlog.node");
	let ripgrepPath = path.join(pkgsPath, "..", "lib", "vscode", "node_modules", "vscode-ripgrep", "bin", "rg");
	if (isWin) {
		ripgrepPath += ".exe";
	}

	if (!fs.existsSync(nodePtyModule)) {
		throw new Error("Could not find pty.node. Ensure all packages have been installed");
	}
	if (!fs.existsSync(spdlogModule)) {
		throw new Error("Could not find spdlog.node. Ensure all packages have been installed");
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
	const cpDir = (dir: string, subdir: "auth" | "unauth", rootPath: string): void => {
		const stat = fs.statSync(dir);
		if (stat.isDirectory()) {
			const paths = fs.readdirSync(dir);
			paths.forEach((p) => cpDir(path.join(dir, p), subdir, rootPath));
		} else if (stat.isFile()) {
			const newPath = path.join(cliBuildPath, "web", subdir, path.relative(rootPath, dir));
			fse.mkdirpSync(path.dirname(newPath));
			fs.writeFileSync(newPath + ".gz", zlib.gzipSync(fs.readFileSync(dir)));
		} else {
			// Nothing
		}
	};
	cpDir(webOutputPath, "auth", webOutputPath);
	cpDir(browserAppOutputPath, "unauth", browserAppOutputPath);
	fse.mkdirpSync(path.join(cliBuildPath, "dependencies"));
	fse.copySync(nodePtyModule, path.join(cliBuildPath, "dependencies", "pty.node"));
	fse.copySync(spdlogModule, path.join(cliBuildPath, "dependencies", "spdlog.node"));
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

const extDirPath = path.join("lib", "vscode-default-extensions");
const copyForDefaultExtensions = register("build:copy-vscode", async (runner) => {
	if (!fs.existsSync(defaultExtensionsPath)) {
		await ensureClean();
		await ensureInstalled();
		await new Promise((resolve, reject): void => {
			fse.remove(extDirPath, (err) => {
				if (err) {
					return reject(err);
				}

				resolve();
			});
		});
		await new Promise((resolve, reject): void => {
			fse.copy(vscodePath, extDirPath, (err) => {
				if (err) {
					return reject(err);
				}

				resolve();
			});
		});
	}
});

const buildDefaultExtensions = register("build:default-extensions", async (runner) => {
	if (!fs.existsSync(defaultExtensionsPath)) {
		await copyForDefaultExtensions();
		runner.cwd = extDirPath;
		const resp = await runner.execute(isWin ? "npx.cmd" : "npx", [isWin ? "gulp.cmd" : "gulp", "vscode-linux-x64", "--max-old-space-size=32384"]);
		if (resp.exitCode !== 0) {
			throw new Error(`Failed to build default extensions: ${resp.stderr}`);
		}
	}
});

const ensureInstalled = register("vscode:install", async (runner) => {
	await ensureCloned();

	runner.cwd = vscodePath;
	const install = await runner.execute(isWin ? "yarn.cmd" : "yarn", []);
	if (install.exitCode !== 0) {
		throw new Error(`Failed to install vscode dependencies: ${install.stderr}`);
	}
});

const ensureCloned = register("vscode:clone", async (runner) => {
	if (fs.existsSync(vscodePath)) {
		await ensureClean();
	} else {
		fse.mkdirpSync(libPath);
		runner.cwd = libPath;
		const clone = await runner.execute("git", ["clone", "https://github.com/microsoft/vscode", "--branch", vscodeVersion, "--single-branch", "--depth=1"]);
		if (clone.exitCode !== 0) {
			throw new Error(`Failed to clone: ${clone.exitCode}`);
		}
	}

	runner.cwd = vscodePath;
	const checkout = await runner.execute("git", ["checkout", vscodeVersion]);
	if (checkout.exitCode !== 0) {
		throw new Error(`Failed to checkout: ${checkout.stderr}`);
	}
});

const ensureClean = register("vscode:clean", async (runner) => {
	runner.cwd = vscodePath;

	const status = await runner.execute("git", ["status", "--porcelain"]);
	if (status.stdout.trim() !== "") {
		const clean = await runner.execute("git", ["clean", "-f", "-d", "-X"]);
		if (clean.exitCode !== 0) {
			throw new Error(`Failed to clean git repository: ${clean.stderr}`);
		}
		const removeUnstaged = await runner.execute("git", ["checkout", "--", "."]);
		if (removeUnstaged.exitCode !== 0) {
			throw new Error(`Failed to remove unstaged files: ${removeUnstaged.stderr}`);
		}
	}
	const fetch = await runner.execute("git", ["fetch", "--prune"]);
	if (fetch.exitCode !== 0) {
		throw new Error(`Failed to fetch latest changes: ${fetch.stderr}`);
	}
});

const ensurePatched = register("vscode:patch", async (runner) => {
	if (!fs.existsSync(vscodePath)) {
		throw new Error("vscode must be cloned to patch");
	}
	await ensureClean();

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
	await os.platform() === "linux"
		? runner.execute("tar", ["-cvzf", `${archiveName}.tar.gz`, `${archiveName}`])
		: runner.execute("zip", ["-r", `${archiveName}.zip`, `${archiveName}`]);
});

run();
