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
	"allow-http"?: boolean;
	cert?: string;
	"cert-key"?: string;
	"extra-builtin-extensions-dir"?: string;
	"extra-extensions-dir"?: string;
	host?: string;
	"no-auth"?: boolean;
	open?: string;
	port?: string;
	socket?: string;
	"webview-port"?: string;
	"webview-socket"?: string;
}

// The last item is _ which is like -- so our options need to come before it.
const last = options.pop()!;

// Remove options that won't work or don't make sense.
let i = options.length;
while (i--) {
	switch (options[i].id) {
		case "add":
		case "diff":
		case "file-uri":
		case "folder-uri":
		case "goto":
		case "new-window":
		case "reuse-window":
		case "wait":
		case "disable-gpu":
		// TODO: pretty sure these don't work but not 100%.
		case "max-memory":
		case "prof-startup":
		case "inspect-extensions":
		case "inspect-brk-extensions":
			options.splice(i, 1);
			break;
	}
}

options.push({ id: "allow-http", type: "boolean", cat: "o", description: "Allow http connections." });
options.push({ id: "cert", type: "string", cat: "o", description: "Path to certificate." });
options.push({ id: "cert-key", type: "string", cat: "o", description: "Path to certificate key." });
options.push({ id: "extra-builtin-extensions-dir", type: "string", cat: "o", description: "Path to extra builtin extension directory." });
options.push({ id: "extra-extensions-dir", type: "string", cat: "o", description: "Path to extra user extension directory." });
options.push({ id: "host", type: "string", cat: "o", description: "Host for the main and webview servers." });
options.push({ id: "no-auth", type: "string", cat: "o", description: "Disable password authentication." });
options.push({ id: "open", type: "boolean", cat: "o", description: "Open in the browser on startup." });
options.push({ id: "port", type: "string", cat: "o", description: "Port for the main server." });
options.push({ id: "socket", type: "string", cat: "o", description: "Listen on a socket instead of host:port." });
options.push({ id: "webview-port", type: "string", cat: "o", description: "Port for the webview server." });
options.push({ id: "webview-socket", type: "string", cat: "o", description: "Listen on a socket instead of host:port." });

options.push(last);

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

	const version = `${(pkg as any).codeServerVersion || "development"}-vsc${pkg.version}`;
	if (args.help) {
		const executable = `${product.applicationName}${os.platform() === "win32" ? ".exe" : ""}`;
		return console.log(buildHelpMessage(
			product.nameLong, executable,
			version,
			undefined,
			false,
		));
	}

	if (args.version) {
		return console.log(buildVersionMessage(version, product.commit));
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
