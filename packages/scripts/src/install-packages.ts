import { exec } from "child_process";
import { existsSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { logger, field } from "../../logger";

/**
 * Install dependencies for a single package.
 */
const doInstall = (pkg: string, path: string): void => {
	logger.info(`Installing "${pkg}" dependencies...`);
	exec("yarn", {
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
	});
};

/**
 * Install dependencies for all packages.
 */
const handlePackages = (dir: string): void => {
	readdirSync(dir).forEach((pkg) => {
		const pkgDir = join(dir, pkg);
		const pkgJsonPath = join(pkgDir, "package.json");
		if (existsSync(pkgJsonPath)) {
			doInstall(pkg, pkgDir);
		}
	});
};

handlePackages(resolve(__dirname, ".."));
