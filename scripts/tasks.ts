import { Binary } from "@coder/nbin";
import { field } from "@coder/logger";
import { register, run } from "@coder/runner";

import * as fs from "fs";
import * as fse from "fs-extra";
import * as https from "https";
import * as os from "os";
import * as path from "path";
import * as tar from "tar";

import { platform } from "./platform";

const libPath = path.join(__dirname, "../lib");
const releasePath = path.resolve(__dirname, "../release");
const target = `${platform()}-${os.arch()}`;
const vscodeVersion = process.env.VSCODE_VERSION || "1.35.0";

/**
 * Build source.
 */
register("build", async (runner, logger, shouldWatch: string) => {
	const watch = shouldWatch === "true";

	logger.info("Building", field("env", {
		NODE_ENV: process.env.NODE_ENV,
		VERSION: process.env.VERSION,
	}), field("vscode", vscodeVersion), field("watch", watch));

	const outPath = path.join(__dirname, "../out");
	const compile = async (): Promise<void> => {
		fse.removeSync(path.resolve(outPath));

		runner.cwd = path.resolve(__dirname, "..");
		const resp = await runner.execute(
			"tsc",
			["--project", "tsconfig.build.json"].concat(watch ? ["--watch"] : []),
		);
		if (resp.exitCode !== 0) {
			throw new Error(`Failed to build: ${resp.stderr}`);
		}
	};

	const copy = async (): Promise<void> => {
		// TODO: If watching, copy every time they change.
		await Promise.all([
			"packages/protocol/src/proto",
			["tsconfig.runtime.json", "tsconfig.json"],
		].map((p) => fse.copy(
			path.resolve(__dirname, "..", Array.isArray(p) ? p[0] : p),
			path.resolve(outPath, Array.isArray(p) ? p[1] : p),
		)));
		fse.unlinkSync(path.resolve(outPath, "packages/protocol/src/proto/index.ts"));
	};

	await ensureInstalled(),
	await Promise.all([
		await compile(),
		await copy(),
	]);
});

/**
 * Bundle built code into a binary with nbin.
 */
register("bundle", async () => {
	const root = path.join(__dirname, "..");
	const bin = new Binary({
		mainFile: path.join(root, "out/packages/server/src/cli.js"),
		target: platform() === "darwin" ? "darwin" : platform() === "musl" ? "alpine" : "linux",
	});

	bin.writeFiles(path.join(root, "lib/**"));
	bin.writeFiles(path.join(root, "out/**"));
	bin.writeFiles(path.join(root, "**/node_modules"));

	fse.mkdirpSync(releasePath);

	bin.build().then((binaryData) => {
		const outputPath = path.join(releasePath, `code-server-${target}`);
		fs.writeFileSync(outputPath, binaryData);
		fs.chmodSync(outputPath, "755");
	}).catch((ex) => {
		// tslint:disable-next-line:no-console
		console.error(ex);
		process.exit(1);
	});
});

/**
 * Make sure the expected VS code version has been downloaded.
 */
const ensureInstalled = register("vscode:install", async (runner, logger) => {
	const vscodePath = path.join(libPath, "vscode");

	const build = async (): Promise<void> => {
		runner.cwd = vscodePath;
		if (!fs.existsSync(path.join(vscodePath, "node_modules"))) {
			await runner.execute("yarn");
		}
		if (!fs.existsSync(path.join(vscodePath, "out"))) {
			await runner.execute("yarn", ["compile"]);
		}
	};

	const clone = async (): Promise<void> => {
		runner.cwd = libPath;
		await runner.execute("git", [
			"clone", "https://github.com/microsoft/vscode",
			"--branch", `${vscodeVersion}`, "--single-branch", "--depth=1",
		]);
	};

	// See if we already have the correct version downloaded.
	if (fs.existsSync(vscodePath)) {
		const pkgVersion = JSON.parse(
			fs.readFileSync(path.join(vscodePath, "package.json")).toString("utf8"),
		).version;
		if (pkgVersion === vscodeVersion) {
			logger.info(`Found existing VS Code ${vscodeVersion} installation`);

			return build();
		}
	}

	fse.removeSync(libPath);
	fse.mkdirpSync(libPath);

	// If we can, fetch the pre-built version to save time. Otherwise we'll need
	// to clone and build.
	await new Promise<void>((resolve, reject): void => {
		const vsSourceUrl = `https://codesrv-ci.cdr.sh/vscode-${vscodeVersion}-prebuilt.tar.gz`;
		https.get(vsSourceUrl, (res) => {
			switch (res.statusCode) {
				case 200:
					logger.info(`Downloading pre-built VS Code ${vscodeVersion}`);
					res.pipe(tar.x({
						C: libPath,
					}).on("finish", () => {
						resolve();
					}).on("error", (err: Error) => {
						reject(err);
					}));
					break;
				case 404:
					logger.info(`VS Code ${vscodeVersion} hasn't been packaged yet`);
					clone().then(() => build()).catch(reject);
					break;
				default:
					return reject(new Error(res.statusMessage));
			}
		}).on("error", (err) => {
			reject(err);
		});
	});
});

/**
 * Package the binary, readme, and license into an archive.
 */
register("package", async (runner, _logger, releaseTag) => {
	if (!releaseTag) {
		throw new Error("Please specify the release tag.");
	}

	const archiveName = `code-server${releaseTag}-${target}`;
	const archiveDir = path.join(releasePath, archiveName);
	fse.removeSync(archiveDir);
	fse.mkdirpSync(archiveDir);

	const binaryPath = path.join(releasePath, `code-server-${target}`);
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
