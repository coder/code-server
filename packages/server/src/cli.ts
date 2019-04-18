import { field, logger } from "@coder/logger";
import { ServerMessage, SharedProcessActive } from "@coder/protocol/src/proto";
import { ChildProcess, fork, ForkOptions } from "child_process";
import { randomFillSync } from "crypto";
import * as fs from "fs";
import * as fse from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as WebSocket from "ws";
import { buildDir, cacheHome, dataHome, isCli, serveStatic } from "./constants";
import { createApp } from "./server";
import { forkModule, requireModule } from "./vscode/bootstrapFork";
import { SharedProcess, SharedProcessState } from "./vscode/sharedProcess";
import opn = require("opn");

import * as commander from "commander";

commander.version(process.env.VERSION || "development")
	.name("code-server")
	.description("Run VS Code on a remote server.")
	.option("--cert <value>")
	.option("--cert-key <value>")
	.option("-e, --extensions-dir <dir>", "Set the root path for extensions.")
	.option("-d --user-data-dir <dir>", "	Specifies the directory that user data is kept in, useful when running as root.")
	.option("--data-dir <value>", "DEPRECATED: Use '--user-data-dir' instead. Customize where user-data is stored.")
	.option("-h, --host <value>", "Customize the hostname.", "0.0.0.0")
	.option("-o, --open", "Open in the browser on startup.", false)
	.option("-p, --port <number>", "Port to bind on.", parseInt(process.env.PORT!, 10) || 8443)
	.option("-N, --no-auth", "Start without requiring authentication.", undefined)
	.option("-H, --allow-http", "Allow http connections.", false)
	.option("-P, --password <value>", "DEPRECATED: Use the PASSWORD environment variable instead. Specify a password for authentication.")
	.option("--disable-telemetry", "Disables ALL telemetry.", false)
	.option("--install-extension <value>", "Install an extension by its ID.")
	.option("--bootstrap-fork <name>", "Used for development. Never set.")
	.option("--extra-args <args>", "Used for development. Never set.")
	.arguments("Specify working directory.")
	.parse(process.argv);

Error.stackTraceLimit = Infinity;
if (isCli) {
	require("nbin").shimNativeFs(buildDir);
	require("nbin").shimNativeFs("/node_modules");
}
// Makes strings or numbers bold in stdout
const bold = (text: string | number): string | number => {
	return `\u001B[1m${text}\u001B[0m`;
};

(async (): Promise<void> => {
	const args = commander.args;
	const options = commander.opts() as {
		noAuth: boolean;
		readonly allowHttp: boolean;
		readonly host: string;
		readonly port: number;
		readonly disableTelemetry: boolean;

		readonly userDataDir?: string;
		readonly extensionsDir?: string;

		readonly dataDir?: string;
		readonly password?: string;
		readonly open?: boolean;
		readonly cert?: string;
		readonly certKey?: string;

		readonly installExtension?: string;

		readonly bootstrapFork?: string;
		readonly extraArgs?: string;
	};

	if (options.disableTelemetry) {
		process.env.DISABLE_TELEMETRY = "true";
	}

	// Commander has an exception for `--no` prefixes. Here we'll adjust that.
	// tslint:disable-next-line:no-any
	const noAuthValue = (commander as any).auth;
	options.noAuth = !noAuthValue;

	const dataDir = path.resolve(options.userDataDir || options.dataDir || path.join(dataHome, "code-server"));
	const extensionsDir = options.extensionsDir ? path.resolve(options.extensionsDir) : path.resolve(dataDir, "extensions");
	const workingDir = path.resolve(args[0] || process.cwd());
	const dependenciesDir = path.join(os.tmpdir(), "code-server/dependencies");

	if (!fs.existsSync(dataDir)) {
		const oldDataDir = path.resolve(path.join(os.homedir(), ".code-server"));
		if (fs.existsSync(oldDataDir)) {
			await fse.move(oldDataDir, dataDir);
			logger.info(`Moved data directory from ${oldDataDir} to ${dataDir}`);
		}
	}

	await Promise.all([
		fse.mkdirp(cacheHome),
		fse.mkdirp(dataDir),
		fse.mkdirp(extensionsDir),
		fse.mkdirp(workingDir),
		fse.mkdirp(dependenciesDir),
	]);

	const unpackExecutable = (binaryName: string): void => {
		const memFile = path.join(isCli ? buildDir! : path.join(__dirname, ".."), "build/dependencies", binaryName);
		const diskFile = path.join(dependenciesDir, binaryName);
		if (!fse.existsSync(diskFile)) {
			fse.writeFileSync(diskFile, fse.readFileSync(memFile));
		}
		fse.chmodSync(diskFile, "755");
	};

	unpackExecutable("rg");
	// tslint:disable-next-line no-any
	(<any>global).RIPGREP_LOCATION = path.join(dependenciesDir, "rg");

	const builtInExtensionsDir = path.resolve(buildDir || path.join(__dirname, ".."), "build/extensions");
	if (options.bootstrapFork) {
		const modulePath = options.bootstrapFork;
		if (!modulePath) {
			logger.error("No module path specified to fork!");
			process.exit(1);
		}

		process.argv = [
			process.argv[0],
			process.argv[1],
			...(options.extraArgs ? JSON.parse(options.extraArgs) : []),
		];

		return requireModule(modulePath, builtInExtensionsDir);
	}

	const logDir = path.join(cacheHome, "code-server/logs", new Date().toISOString().replace(/[-:.TZ]/g, ""));
	process.env.VSCODE_LOGS = logDir;

	const certPath = options.cert ? path.resolve(options.cert) : undefined;
	const certKeyPath = options.certKey ? path.resolve(options.certKey) : undefined;

	if (certPath && !certKeyPath) {
		logger.error("'--cert-key' flag is required when specifying a certificate!");
		process.exit(1);
	}

	if (!certPath && certKeyPath) {
		logger.error("'--cert' flag is required when specifying certificate key!");
		process.exit(1);
	}

	let certData: Buffer | undefined;
	let certKeyData: Buffer | undefined;

	if (typeof certPath !== "undefined" && typeof certKeyPath !== "undefined") {
		try {
			certData = fs.readFileSync(certPath);
		} catch (ex) {
			logger.error(`Failed to read certificate: ${ex.message}`);
			process.exit(1);
		}

		try {
			certKeyData = fs.readFileSync(certKeyPath);
		} catch (ex) {
			logger.error(`Failed to read certificate key: ${ex.message}`);
			process.exit(1);
		}
	}

	logger.info(`\u001B[1mcode-server ${process.env.VERSION ? `v${process.env.VERSION}` : "development"}`);

	if (options.dataDir) {
		logger.warn('"--data-dir" is deprecated. Use "--user-data-dir" instead.');
	}

	if (options.installExtension) {
		const fork = forkModule("vs/code/node/cli", [
			"--user-data-dir", dataDir,
			"--builtin-extensions-dir", builtInExtensionsDir,
			"--extensions-dir", extensionsDir,
			"--install-extension", options.installExtension,
		], {
			env: {
				VSCODE_ALLOW_IO: "true",
				VSCODE_LOGS: process.env.VSCODE_LOGS,
			},
		}, dataDir);

		fork.stdout.on("data", (d: Buffer) => d.toString().split("\n").forEach((l) => logger.info(l)));
		fork.stderr.on("data", (d: Buffer) => d.toString().split("\n").forEach((l) => logger.error(l)));
		fork.on("exit", () => process.exit());

		return;
	}

	// TODO: fill in appropriate doc url
	logger.info("Additional documentation: http://github.com/codercom/code-server");
	logger.info("Initializing", field("data-dir", dataDir), field("extensions-dir", extensionsDir), field("working-dir", workingDir), field("log-dir", logDir));
	const sharedProcess = new SharedProcess(dataDir, extensionsDir, builtInExtensionsDir);
	const sendSharedProcessReady = (socket: WebSocket): void => {
		const active = new SharedProcessActive();
		active.setSocketPath(sharedProcess.socketPath);
		active.setLogPath(logDir);
		const serverMessage = new ServerMessage();
		serverMessage.setSharedProcessActive(active);
		socket.send(serverMessage.serializeBinary());
	};
	sharedProcess.onState((event) => {
		if (event.state === SharedProcessState.Ready) {
			app.wss.clients.forEach((c) => sendSharedProcessReady(c));
		}
	});

	if (options.password) {
		logger.warn('"--password" is deprecated. Use the PASSWORD environment variable instead.');
	}

	let password = options.password || process.env.PASSWORD;
	if (!password) {
		// Generate a random password with a length of 24.
		const buffer = Buffer.alloc(12);
		randomFillSync(buffer);
		password = buffer.toString("hex");
	}

	const hasCustomHttps = certData && certKeyData;
	const app = await createApp({
		allowHttp: options.allowHttp,
		bypassAuth: options.noAuth,
		registerMiddleware: (app): void => {
			// If we're not running from the binary and we aren't serving the static
			// pre-built version, use webpack to serve the web files.
			if (!isCli && !serveStatic) {
				const webpackConfig = require(path.resolve(__dirname, "..", "..", "web", "webpack.config.js"));
				const compiler = require("webpack")(webpackConfig);
				app.use(require("webpack-dev-middleware")(compiler, {
					logger: {
						trace: (m: string): void => logger.trace("webpack", field("message", m)),
						debug: (m: string): void => logger.debug("webpack", field("message", m)),
						info: (m: string): void => logger.info("webpack", field("message", m)),
						warn: (m: string): void => logger.warn("webpack", field("message", m)),
						error: (m: string): void => logger.error("webpack", field("message", m)),
					},
					publicPath: webpackConfig.output.publicPath,
					stats: webpackConfig.stats,
				}));
				app.use(require("webpack-hot-middleware")(compiler));
			}
		},
		serverOptions: {
			extensionsDirectory: extensionsDir,
			builtInExtensionsDirectory: builtInExtensionsDir,
			dataDirectory: dataDir,
			workingDirectory: workingDir,
			cacheDirectory: cacheHome,
			fork: (modulePath: string, args?: string[], options?: ForkOptions): ChildProcess => {
				if (options && options.env && options.env.AMD_ENTRYPOINT) {
					return forkModule(options.env.AMD_ENTRYPOINT, args, options, dataDir);
				}

				return fork(modulePath, args, options);
			},
		},
		password,
		httpsOptions: hasCustomHttps ? {
			key: certKeyData,
			cert: certData,
		} : undefined,
	});

	logger.info("Starting webserver...", field("host", options.host), field("port", options.port));
	app.server.listen(options.port, options.host);
	let clientId = 1;
	app.wss.on("connection", (ws, req) => {
		const id = clientId++;

		if (sharedProcess.state === SharedProcessState.Ready) {
			sendSharedProcessReady(ws);
		}

		logger.info(`WebSocket opened \u001B[0m${req.url}`, field("client", id), field("ip", req.socket.remoteAddress));

		ws.on("close", (code) => {
			logger.info(`WebSocket closed \u001B[0m${req.url}`, field("client", id), field("code", code));
		});
	});
	app.wss.on("error", (err: NodeJS.ErrnoException) => {
		if (err.code === "EADDRINUSE") {
			logger.error(`Port ${bold(options.port)} is in use. Please free up port ${options.port} or specify a different port with the -p flag`);
			process.exit(1);
		}
	});
	if (!options.certKey && !options.cert) {
		logger.warn("No certificate specified. \u001B[1mThis could be insecure.");
		// TODO: fill in appropriate doc url
		logger.warn("Documentation on securing your setup: https://github.com/codercom/code-server/blob/master/doc/security/ssl.md");
	}

	if (!options.noAuth) {
		logger.info(" ");
		logger.info(`Password:\u001B[1m ${password}`);
	} else {
		logger.warn("Launched without authentication.");
	}

	const url = `http://localhost:${options.port}/`;
	logger.info(" ");
	logger.info("Started (click the link below to open):");
	logger.info(url);
	logger.info(" ");

	if (options.open) {
		try {
			await opn(url);
		} catch (e) {
			logger.warn("Url couldn't be opened automatically.", field("url", url), field("exception", e));
		}
	}
})().catch((ex) => {
	logger.error(ex);
});
