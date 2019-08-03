import * as os from "os";

import { validatePaths } from "vs/code/node/paths";
import { parseMainProcessArgv } from "vs/platform/environment/node/argvHelper";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { buildHelpMessage, buildVersionMessage, options } from "vs/platform/environment/node/argv";
import pkg from "vs/platform/product/node/package";
import product from "vs/platform/product/node/product";

import { MainServer } from "vs/server/src/server";
import { enableExtensionTars } from "vs/server/src/tar";
import { AuthType, buildAllowedMessage, generateCertificate, generatePassword, localRequire, open, unpackExecutables } from "vs/server/src/util";
import { main as vsCli } from "vs/code/node/cliProcessMain";

const { logger } = localRequire<typeof import("@coder/logger/out/index")>("@coder/logger/out/index");

interface Args extends ParsedArgs {
	auth?: AuthType;
	"base-path"?: string;
	cert?: string;
	"cert-key"?: string;
	"extra-builtin-extensions-dir"?: string;
	"extra-extensions-dir"?: string;
	host?: string;
	open?: string;
	port?: string;
	socket?: string;
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

options.push({ id: "base-path", type: "string", cat: "o", description: "Base path of the URL at which code-server is hosted (used for login redirects)." });
options.push({ id: "cert", type: "string", cat: "o", description: "Path to certificate. If the path is omitted, both this and --cert-key will be generated." });
options.push({ id: "cert-key", type: "string", cat: "o", description: "Path to the certificate's key if one was provided." });
options.push({ id: "extra-builtin-extensions-dir", type: "string", cat: "o", description: "Path to an extra builtin extension directory." });
options.push({ id: "extra-extensions-dir", type: "string", cat: "o", description: "Path to an extra user extension directory." });
options.push({ id: "host", type: "string", cat: "o", description: "Host for the server." });
options.push({ id: "auth", type: "string", cat: "o", description: `The type of authentication to use. ${buildAllowedMessage(AuthType)}.` });
options.push({ id: "open", type: "boolean", cat: "o", description: "Open in the browser on startup." });
options.push({ id: "port", type: "string", cat: "o", description: "Port for the main server." });
options.push({ id: "socket", type: "string", cat: "o", description: "Listen on a socket instead of host:port." });

options.push(last);

const main = async (): Promise<void | void[]> => {
	const args = validatePaths(parseMainProcessArgv(process.argv)) as Args;
	["extra-extensions-dir", "extra-builtin-extensions-dir"].forEach((key) => {
		if (typeof args[key] === "string") {
			args[key] = [args[key]];
		}
	});

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
		return console.log(buildHelpMessage(product.nameLong, executable, version, undefined, false));
	}

	if (args.version) {
		return buildVersionMessage(version, product.commit).split("\n").map((line) => logger.info(line));
	}

	enableExtensionTars();

	const shouldSpawnCliProcess = (): boolean => {
		return !!args["install-source"]
			|| !!args["list-extensions"]
			|| !!args["install-extension"]
			|| !!args["uninstall-extension"]
			|| !!args["locate-extension"]
			|| !!args["telemetry"];
	};

	if (shouldSpawnCliProcess()) {
		await vsCli(args);
		return process.exit(0); // There is a WriteStream instance keeping it open.
	}

	const extra = args["_"] || [];
	const options = {
		auth: args.auth,
		basePath: args["base-path"],
		cert: args.cert,
		certKey: args["cert-key"],
		folderUri: extra.length > 1 ? extra[extra.length - 1] : undefined,
		host: args.host,
		password: process.env.PASSWORD,
	};

	if (options.auth && Object.keys(AuthType).filter((k) => AuthType[k] === options.auth).length === 0) {
		throw new Error(`'${options.auth}' is not a valid authentication type.`);
	} else if (options.auth && !options.password) {
		options.password = await generatePassword();
	}

	if (!options.certKey && typeof options.certKey !== "undefined") {
		throw new Error(`--cert-key cannot be blank`);
	} else if (options.certKey && !options.cert) {
		throw new Error(`--cert-key was provided but --cert was not`);
	} if (!options.cert && typeof options.cert !== "undefined") {
		const { cert, certKey } = await generateCertificate();
		options.cert = cert;
		options.certKey = certKey;
	}

	const server = new MainServer({
		...options,
		port: typeof args.port !== "undefined" && parseInt(args.port, 10) || 8443,
		socket: args.socket,
	}, args);

	const [serverAddress, /* ignore */] = await Promise.all([
		server.listen(),
		unpackExecutables(),
	]);
	logger.info(`Server listening on ${serverAddress}`);

	if (options.auth && !process.env.PASSWORD) {
		logger.info(`  - Password is ${options.password}`);
		logger.info("  - To use your own password, set the PASSWORD environment variable");
	} else if (options.auth) {
		logger.info("  - Using custom password for authentication");
	} else {
		logger.info("  - No authentication");
	}

	if (server.protocol === "https") {
		logger.info(
			args.cert
				? `  - Using provided certificate${args["cert-key"] ? " and key" : ""} for HTTPS`
				: `  - Using generated certificate and key for HTTPS`,
		);
	} else {
		logger.info("  - Not serving HTTPS");
	}

	if (!server.options.socket && args.open) {
		// The web socket doesn't seem to work if using 0.0.0.0.
		const openAddress = `http://localhost:${server.options.port}`;
		await open(openAddress).catch(console.error);
		logger.info(`  - Opened ${openAddress}`);
	}
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
