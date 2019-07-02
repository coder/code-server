import * as os from "os";
import { validatePaths } from "vs/code/node/paths";
import { parseMainProcessArgv } from "vs/platform/environment/node/argvHelper";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { buildHelpMessage, buildVersionMessage } from "vs/platform/environment/node/argv";
import product from "vs/platform/product/node/product";
import pkg from "vs/platform/product/node/package";
import { MainServer, WebviewServer } from "vs/server/server";
import "vs/server/tar";

interface IMainCli {
	main: (argv: ParsedArgs) => Promise<void>;
}

const main = async (): Promise<void> => {
	const args = validatePaths(parseMainProcessArgv(process.argv));

	if (!product.extensionsGallery) {
		product.extensionsGallery = {
			serviceUrl: process.env.SERVICE_URL || "https://v1.extapi.coder.com",
			itemUrl: process.env.ITEM_URL || "",
			controlUrl: "",
			recommendationsUrl: "",
		};
	}

	if (args.help) {
		const executable = `${product.applicationName}${os.platform() === "win32" ? ".exe" : ""}`;
		return console.log(buildHelpMessage(product.nameLong, executable, pkg.version));
	}

	if (args.version) {
		return console.log(buildVersionMessage(pkg.version, product.commit));
	}

	const shouldSpawnCliProcess = (): boolean => {
		return !!args["install-source"]
			|| !!args["list-extensions"]
			|| !!args["install-extension"]
			|| !!args["uninstall-extension"]
			|| !!args["locate-extension"]
			|| !!args["telemetry"];
	};

	if (shouldSpawnCliProcess()) {
		const cli = await new Promise<IMainCli>((c, e) => require(["vs/code/node/cliProcessMain"], c, e));
		await cli.main(args);
		// There is some WriteStream instance keeping it open so force an exit.
		return process.exit(0);
	}

	const webviewServer = new WebviewServer();
	const server = new MainServer(webviewServer, args);
	// The main server inserts webview server address to the root HTML, so we'll
	// need to wait for it to listen otherwise the address will be null.
	await webviewServer.listen(8444);
	await server.listen(8443);
	console.log(`Main server serving ${server.address}`);
	console.log(`Webview server serving ${webviewServer.address}`);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
