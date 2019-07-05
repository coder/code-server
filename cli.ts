import * as os from "os";
import { validatePaths } from "vs/code/node/paths";
import { parseMainProcessArgv } from "vs/platform/environment/node/argvHelper";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { buildHelpMessage, buildVersionMessage, options } from "vs/platform/environment/node/argv";
import product from "vs/platform/product/node/product";
import pkg from "vs/platform/product/node/package";
import { MainServer, WebviewServer } from "vs/server/server";
import "vs/server/tar";

interface Args extends ParsedArgs {
	port?: string;
	"webview-port"?: string;
}

options.push({ id: "port", type: "string", cat: "o", description: "Port for the main server." });
options.push({ id: "webview-port", type: "string", cat: "o", description: "Port for the webview server." });

interface IMainCli {
	main: (argv: ParsedArgs) => Promise<void>;
}

const main = async (): Promise<void> => {
	const args = validatePaths(parseMainProcessArgv(process.argv)) as Args;

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

	const webviewServer = new WebviewServer(typeof args["webview-port"] !== "undefined" && parseInt(args["webview-port"], 10) || 8444);
	const server = new MainServer(typeof args.port !== "undefined" && parseInt(args.port, 10) || 8443, webviewServer, args);
	const [webviewAddress, serverAddress] = await Promise.all([
		webviewServer.listen(),
		server.listen()
	]);
	console.log(`Main server serving ${serverAddress}`);
	console.log(`Webview server serving ${webviewAddress}`);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
