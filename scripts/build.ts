import { Binary } from "@coder/nbin";
import * as cp from "child_process";
// import * as crypto from "crypto";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as util from "util";

enum Task {
	/**
	 * Use before running anything that only works inside VS Code.
	 */
	EnsureInVscode = "ensure-in-vscode",
	Binary = "binary",
	Package = "package",
	Build = "build",
}

class Builder {
	private readonly rootPath = path.resolve(__dirname, "..");
	private readonly outPath = process.env.OUT || this.rootPath;
	private _target?: "darwin" | "alpine" | "linux";
	private currentTask?: Task;

	public run(task: Task | undefined, args: string[]): void {
		this.currentTask = task;
		this.doRun(task, args).catch((error) => {
			console.error(error.message);
			process.exit(1);
		});
	}

	private async task<T>(message: string, fn: () => Promise<T>): Promise<T> {
		const time = Date.now();
		this.log(`${message}...`, true);
		try {
			const t = await fn();
			process.stdout.write(`took ${Date.now() - time}ms\n`);
			return t;
		} catch (error) {
			process.stdout.write("failed\n");
			throw error;
		}
	}

	/**
	 * Writes to stdout with an optional newline.
	 */
	private log(message: string, skipNewline: boolean = false): void {
		process.stdout.write(`[${this.currentTask || "default"}] ${message}`);
		if (!skipNewline) {
			process.stdout.write("\n");
		}
	}

	private async doRun(task: Task | undefined, args: string[]): Promise<void> {
		if (!task) {
			throw new Error("No task provided");
		}

		if (task === Task.EnsureInVscode) {
			return process.exit(this.isInVscode(this.rootPath) ? 0 : 1);
		}

		// If we're inside VS Code assume we want to develop. In that case we should
		// set an OUT directory and not build in this directory, otherwise when you
		// build/watch VS Code the build directory will be included.
		if (this.isInVscode(this.outPath)) {
			throw new Error("Should not build inside VS Code; set the OUT environment variable");
		}

		this.ensureArgument("rootPath", this.rootPath);
		this.ensureArgument("outPath", this.outPath);

		const arch = this.ensureArgument("arch", os.arch().replace(/^x/, "x86_"));
		const target = this.ensureArgument("target", await this.target());
		const vscodeVersion = this.ensureArgument("vscodeVersion", args[0]);
		const codeServerVersion = this.ensureArgument("codeServerVersion", args[1]);

		const vscodeSourcePath = path.join(this.outPath, "source", `vscode-${vscodeVersion}-source`);
		const binariesPath = path.join(this.outPath, "binaries");
		const binaryName = `code-server${codeServerVersion}-vsc${vscodeVersion}-${target}-${arch}`;
		const finalBuildPath = path.join(this.outPath, "build", `${binaryName}-built`);

		switch (task) {
			case Task.Binary:
				return this.binary(finalBuildPath, binariesPath, binaryName);
			case Task.Package:
				return this.package(vscodeSourcePath, binariesPath, binaryName);
			case Task.Build:
				return this.build(vscodeSourcePath, vscodeVersion, codeServerVersion, finalBuildPath);
			default:
				throw new Error(`No task matching "${task}"`);
		}
	}

	/**
	 * Get the target of the system.
	 */
	private async target(): Promise<"darwin" | "alpine" | "linux"> {
		if (!this._target) {
			if (os.platform() === "darwin" || (process.env.OSTYPE && /^darwin/.test(process.env.OSTYPE))) {
				this._target = "darwin";
			} else {
				// Alpine's ldd doesn't have a version flag but if you use an invalid flag
				// (like --version) it outputs the version to stderr and exits with 1.
				const result = await util.promisify(cp.exec)("ldd --version")
					.catch((error) => ({ stderr: error.message, stdout: "" }));
				if (/musl/.test(result.stderr) || /musl/.test(result.stdout)) {
					this._target = "alpine";
				} else {
					this._target = "linux";
				}
			}
		}
		return this._target;
	}

	/**
	 * Make sure the argument is set. Display the value if it is.
	 */
	private ensureArgument(name: string, arg?: string): string {
		if (!arg) {
			this.log(`${name} is missing`);
			throw new Error("Usage: <vscodeVersion> <codeServerVersion>");
		}
		this.log(`${name} is "${arg}"`);
		return arg;
	}

	/**
	 * Return true if it looks like we're inside VS Code. This is used to prevent
	 * accidentally building inside VS Code while developing which causes issues
	 * because the watcher will try compiling those built files.
	 */
	private isInVscode(pathToCheck: string): boolean {
		let inside = false;
		const maybeVsCode = path.join(pathToCheck, "../../../");
		try {
			// If it has a package.json with the right name it's probably VS Code.
			inside = require(path.join(maybeVsCode, "package.json")).name === "code-oss-dev";
		} catch (error) {}
		this.log(
			inside
				? `Running inside VS Code ([${maybeVsCode}]${path.relative(maybeVsCode, pathToCheck)})`
				: "Not running inside VS Code"
		);
		return inside;
	}

	/**
	 * Build code-server within VS Code.
	 */
	private async build(vscodeSourcePath: string, vscodeVersion: string, codeServerVersion: string, finalBuildPath: string): Promise<void> {
		// Install dependencies (should be cached by CI).
		await this.task("Installing code-server dependencies", async () => {
			await util.promisify(cp.exec)("yarn", { cwd: this.rootPath });
		});

		// Download and prepare VS Code if necessary (should be cached by CI).
		if (fs.existsSync(vscodeSourcePath)) {
			this.log("Using existing VS Code clone");
		} else {
			await this.task("Cloning VS Code", () => {
				return util.promisify(cp.exec)(
					"git clone https://github.com/microsoft/vscode"
						+ ` --quiet --branch "${vscodeVersion}"`
						+ ` --single-branch --depth=1 "${vscodeSourcePath}"`);
			});
		}

		await this.task("Installing VS Code dependencies", () => {
			return util.promisify(cp.exec)("yarn", { cwd: vscodeSourcePath });
		});

		if (fs.existsSync(path.join(vscodeSourcePath, ".build/extensions"))) {
			this.log("Using existing built-in-extensions");
		} else {
			await this.task("Building default extensions", () => {
				return util.promisify(cp.exec)(
					"yarn gulp compile-extensions-build --max-old-space-size=32384",
					{ cwd: vscodeSourcePath },
				);
			});
		}

		// Clean before patching or it could fail if already patched.
		await this.task("Patching VS Code", async () => {
			await util.promisify(cp.exec)("git reset --hard", { cwd: vscodeSourcePath });
			await util.promisify(cp.exec)("git clean -fd", { cwd: vscodeSourcePath });
			await util.promisify(cp.exec)(`git apply ${this.rootPath}/scripts/vscode.patch`, { cwd: vscodeSourcePath });
		});

		const serverPath = path.join(vscodeSourcePath, "src/vs/server");
		await this.task("Copying code-server into VS Code", async () => {
			await fs.remove(serverPath);
			await fs.mkdirp(serverPath);
			await Promise.all(["main.js", "node_modules", "src", "typings"].map((fileName) => {
				return fs.copy(path.join(this.rootPath, fileName), path.join(serverPath, fileName));
			}));
		});

		await this.task("Building VS Code", () => {
			return util.promisify(cp.exec)("yarn gulp compile-build --max-old-space-size=32384", { cwd: vscodeSourcePath });
		});

		await this.task("Optimizing VS Code", async () => {
			await fs.copyFile(path.join(this.rootPath, "scripts/optimize.js"), path.join(vscodeSourcePath, "coder.js"));
			await util.promisify(cp.exec)(`yarn gulp optimize --max-old-space-size=32384 --gulpfile ./coder.js`, { cwd: vscodeSourcePath });
		});

		const { productJson, packageJson } = await this.task("Generating final package.json and product.json", async () => {
			const merge = async (name: string, extraJson: { [key: string]: string } = {}): Promise<{ [key: string]: string }> => {
				const [aJson, bJson] = (await Promise.all([
					fs.readFile(path.join(vscodeSourcePath, `${name}.json`), "utf8"),
					fs.readFile(path.join(this.rootPath, `scripts/${name}.json`), "utf8"),
				])).map((raw) => {
					const json = JSON.parse(raw);
					delete json.scripts;
					delete json.dependencies;
					delete json.devDependencies;
					delete json.optionalDependencies;
					return json;
				});

				return { ...aJson, ...bJson, ...extraJson };
			};

			const date = new Date().toISOString();
			const commit = require(path.join(vscodeSourcePath, "build/lib/util")).getVersion(this.rootPath);

			const [productJson, packageJson] = await Promise.all([
				merge("product", { commit, date }),
				merge("package", { codeServerVersion: `${codeServerVersion}-vsc${vscodeVersion}` }),
			]);

			// We could do this before the optimization but then it'd be copied into
			// three files and unused in two which seems like a waste of bytes.
			const apiPath = path.join(vscodeSourcePath, "out-vscode/vs/workbench/workbench.web.api.js");
			await fs.writeFile(apiPath, (await fs.readFile(apiPath, "utf8")).replace('{ /*BUILD->INSERT_PRODUCT_CONFIGURATION*/}', JSON.stringify({
				version: packageJson.version,
				codeServerVersion: packageJson.codeServerVersion,
				...productJson,
			})));

			return { productJson, packageJson };
		});

		if (process.env.MINIFY) {
			await this.task("Minifying VS Code", () => {
				return util.promisify(cp.exec)("yarn gulp minify --max-old-space-size=32384 --gulpfile ./coder.js", { cwd: vscodeSourcePath });
			});
		}

		const finalServerPath = path.join(finalBuildPath, "out/vs/server");
		await this.task("Copying into final build directory", async () => {
			await fs.remove(finalBuildPath);
			await fs.mkdirp(finalBuildPath);
			await Promise.all([
				fs.copy(path.join(vscodeSourcePath, "remote/node_modules"), path.join(finalBuildPath, "node_modules")),
				fs.copy(path.join(vscodeSourcePath, ".build/extensions"), path.join(finalBuildPath, "extensions")),
				fs.copy(path.join(vscodeSourcePath, `out-vscode${process.env.MINIFY ? "-min" : ""}`), path.join(finalBuildPath, "out")).then(() => {
					return Promise.all([
						fs.remove(path.join(finalServerPath, "node_modules")).then(() => {
							return fs.copy(path.join(serverPath, "node_modules"), path.join(finalServerPath, "node_modules"));
						}),
						fs.copy(path.join(finalServerPath, "src/browser/workbench-build.html"), path.join(finalServerPath, "src/browser/workbench.html")),
					]);
				}),
			]);
		});

		if (process.env.MINIFY) {
			await this.task("Restricting to production dependencies", async () => {
				await Promise.all(["package.json", "yarn.lock"].map((fileName) => {
					Promise.all([
						fs.copy(path.join(this.rootPath, fileName), path.join(finalServerPath, fileName)),
						fs.copy(path.join(path.join(vscodeSourcePath, "remote"), fileName), path.join(finalBuildPath, fileName)),
					]);
				}));

				await Promise.all([finalServerPath, finalBuildPath].map((cwd) => {
					return util.promisify(cp.exec)("yarn --production", { cwd });
				}));

				await Promise.all(["package.json", "yarn.lock"].map((fileName) => {
					return Promise.all([
						fs.remove(path.join(finalServerPath, fileName)),
						fs.remove(path.join(finalBuildPath, fileName)),
					]);
				}));
			});
		}

		await this.task("Writing final package.json and product.json", () => {
			return Promise.all([
				fs.writeFile(path.join(finalBuildPath, "package.json"), JSON.stringify(packageJson, null, 2)),
				fs.writeFile(path.join(finalBuildPath, "product.json"), JSON.stringify(productJson, null, 2)),
			]);
		});

		// Prevent needless cache changes.
		await this.task("Cleaning for smaller cache", () => {
			return Promise.all([
				fs.remove(serverPath),
				fs.remove(path.join(vscodeSourcePath, "out-vscode")),
				fs.remove(path.join(vscodeSourcePath, "out-vscode-min")),
				fs.remove(path.join(vscodeSourcePath, "out-build")),
				util.promisify(cp.exec)("git reset --hard", { cwd: vscodeSourcePath }).then(() => {
					return util.promisify(cp.exec)("git clean -fd", { cwd: vscodeSourcePath });
				}),
			]);
		});

		// Prepend code to the target which enables finding files within the binary.
		const prependLoader = async (relativeFilePath: string): Promise<void> => {
			const filePath = path.join(finalBuildPath, relativeFilePath);
			const shim = `
				if (!global.NBIN_LOADED) {
					try {
						const nbin = require("nbin");
						nbin.shimNativeFs("${finalBuildPath}");
						global.NBIN_LOADED = true;
						const path = require("path");
						const rg = require("vscode-ripgrep");
						rg.binaryRgPath = rg.rgPath;
						rg.rgPath = path.join(require("os").tmpdir(), "code-server", path.basename(rg.binaryRgPath));
					} catch (error) { /*  Not in the binary. */ }
				}
			`;
			await fs.writeFile(filePath, shim + (await fs.readFile(filePath, "utf8")));
		};

		await this.task("Prepending nbin loader", () => {
			return Promise.all([
				prependLoader("out/vs/server/main.js"),
				prependLoader("out/bootstrap-fork.js"),
				prependLoader("extensions/node_modules/typescript/lib/tsserver.js"),
			]);
		});

		this.log(`Final build: ${finalBuildPath}`);
	}

	/**
	 * Bundles the built code into a binary.
	 */
	private async binary(targetPath: string, binariesPath: string, binaryName: string): Promise<void> {
		const bin = new Binary({
			mainFile: path.join(targetPath, "out/vs/server/main.js"),
			target: await this.target(),
		});

		bin.writeFiles(path.join(targetPath, "**"));

		await fs.mkdirp(binariesPath);

		const binaryPath = path.join(binariesPath, binaryName);
		await fs.writeFile(binaryPath, await bin.build());
		await fs.chmod(binaryPath, "755");

		this.log(`Binary: ${binaryPath}`);
	}

	/**
	 * Package the binary into a release archive.
	 */
	private async package(vscodeSourcePath: string, binariesPath: string, binaryName: string): Promise<void> {
		const releasePath = path.join(this.outPath, "release");
		const archivePath = path.join(releasePath, binaryName);

		await fs.remove(archivePath);
		await fs.mkdirp(archivePath);

		await fs.copyFile(path.join(binariesPath, binaryName), path.join(archivePath, "code-server"));
		await fs.copyFile(path.join(this.rootPath, "README.md"), path.join(archivePath, "README.md"));
		await fs.copyFile(path.join(vscodeSourcePath, "LICENSE.txt"), path.join(archivePath, "LICENSE.txt"));
		await fs.copyFile(path.join(vscodeSourcePath, "ThirdPartyNotices.txt"), path.join(archivePath, "ThirdPartyNotices.txt"));

		if ((await this.target()) === "darwin") {
			await util.promisify(cp.exec)(`zip -r "${binaryName}.zip" "${binaryName}"`, { cwd: releasePath });
			this.log(`Archive: ${archivePath}.zip`);
		} else {
			await util.promisify(cp.exec)(`tar -czf "${binaryName}.tar.gz" "${binaryName}"`, { cwd: releasePath });
			this.log(`Archive: ${archivePath}.tar.gz`);
		}
	}
}

const builder = new Builder();
builder.run(process.argv[2] as Task, process.argv.slice(3));
