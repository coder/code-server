import { exec, execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import * as os from "os";
import { join, resolve } from "path";
import { logger, field } from "../packages/logger/src/logger";

/**
 * Install dependencies for a single package.
 */
const doInstall = (pkg: string, path: string): Promise<void> => {
	logger.info(`Installing "${pkg}" dependencies...`);

	return new Promise((resolve): void => {
		exec("yarn --network-concurrency 1", {
			cwd: path,
			maxBuffer: 1024 * 1024 * 10,
		}, (error, stdout, stderr) => {
			if (error) {
				logger.error(
					`Failed to install "${pkg}" dependencies`,
					field("error", error),
					field("stdout", stdout),
					field("stderr", stderr),
				);
				process.exit(1);
			}

			logger.info(`Successfully grabbed \"${pkg}\" dependencies!`);
			resolve();
		});
	});
};

/**
 * Install dependencies for all packages.
 */
const handlePackages = async (dir: string): Promise<void> => {
	const dirs = readdirSync(dir);
	for (let i = 0; i < dirs.length; i++) {
		const pkg = dirs[i];
		const pkgDir = join(dir, pkg);
		const pkgJsonPath = join(pkgDir, "package.json");
		if (existsSync(pkgJsonPath)) {
			const ip = await doInstall(pkg, pkgDir);
		}
	}
};

handlePackages(resolve(__dirname, "..", "packages")).then(() => {
	return handlePackages(resolve(__dirname, "..", "packages", "app"));
});
