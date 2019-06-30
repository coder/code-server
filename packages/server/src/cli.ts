import { field, logger } from "@coder/logger";
import { ServerMessage, SharedProcessActive } from "@coder/protocol/src/proto";
import { withEnv } from "@coder/protocol";
import { ChildProcess, fork, ForkOptions } from "child_process";
import { randomFillSync } from "crypto";
import * as fs from "fs";
import * as fse from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as WebSocket from "ws";
import { buildDir, cacheHome, dataHome, isCli, serveStatic, defaultHost, defaultPort, defaultBindAddress } from "./constants";
import { createApp } from "./server";
import { forkModule, requireModule } from "./vscode/bootstrapFork";
import { SharedProcess, SharedProcessState } from "./vscode/sharedProcess";
import open = require("open");

import * as commander from "commander";

const collect = <T>(value: T, previous: T[]): T[] => {
	return previous.concat(value);
};

// collectFresh does the same thing as collect but doesn't do anything with
// `previous`.
const collectFresh = <T>(): (value: T, previous: T[]) => T[] => {
	let fresh: T[] = [];

	return (value: T, previous: T[]): T[] => {
		fresh.push(value);

		return fresh;
	};
};

commander.version(process.env.VERSION || "development")
	.name("code-server")
	.description("Run VS Code on a remote server.")
	.option("--cert <value>")
	.option("--cert-key <value>")
	.option("-e, --extensions-dir <dir>", "Override the main default path for user extensions.")
	.option("--extra-extensions-dir [dir]", "Path to an extra user extension directory (repeatable).", collect, [])
	.option("--extra-builtin-extensions-dir [dir]", "Path to an extra built-in extension directory (repeatable).", collect, [])
	.option("-d, --user-data-dir <dir>", "Specifies the directory that user data is kept in, useful when running as root.")
	.option("-b, --bind <address>", "Specifies addresses to bind to in [HOST][:PORT] notation (repeatable).", collectFresh(), [defaultBindAddress])
	.option("-o, --open", "Open in the browser on startup. If multiple '--bind' arguments are supplied, only the first one will be opened.", false)
	.option("-N, --no-auth", "Start without requiring authentication.", false)
	.option("-H, --allow-http", "Allow http connections.", false)
	.option("--disable-telemetry", "Disables ALL telemetry.", false)
	.option("--socket <value>", "Listen on a UNIX socket. Cannot be provided with '--bind'.")
	.option("--install-extension <value>", "Install an extension by its ID.")
	.option("--bootstrap-fork <name>", "Used for development. Never set.")
	.option("--extra-args <args>", "Used for development. Never set.")

	.option("--data-dir <value>", "DEPRECATED: Use '--user-data-dir' instead. Customize where user-data is stored.")
	.option("-h, --host <value>", "DEPRECATED: Use '--bind' instead. Customize the hostname. Cannot be provided with '--bind'.")
	.option("-p, --port <number>", "DEPRECATED: Use '--bind' instead. Port to bind on. Cannot be provided with '--bind'.")
	.option("-P, --password <value>", "DEPRECATED: Use the 'PASSWORD' environment variable instead. Specify a password for authentication.")

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

interface BindAddress {
	readonly host: string;
	readonly port: number;
}

// Parses a bind address string into a BindAddress. A bind address string can be
// just a hostname, or a hostname:port, or just a :port.
const parseBindAddress = (addr: string): BindAddress => {
	let host = defaultHost;
	let port = defaultPort;

	const split = addr.split(":");
	if (split.length > 2) {
		throw new Error(`Invalid bind address '${addr}'.`);
	}

	if (split.length === 1) {
		if (split[0] === "") {
			throw new Error(`Invalid bind address '${addr}'.`);
		}
		host = split[0];
	} else {
		if (split[0] !== "") {
			host = split[0];
		}
		port = parseInt(split[1], 10);
		if (isNaN(port) || port < 0 || port > 65535) {
			throw new Error(`Invalid bind address '${addr}': invalid port.`);
		}
	}

	return { host, port };
};

(async (): Promise<void> => {
	const args = commander.args;
	const options = commander.opts() as {
		noAuth: boolean;
		bind: string[];
		readonly allowHttp: boolean;
		readonly host?: string;
		readonly port?: number;
		readonly disableTelemetry: boolean;

		readonly userDataDir?: string;
		readonly extensionsDir?: string;
		readonly extraExtensionsDir?: string[];
		readonly extraBuiltinExtensionsDir?: string[];

		readonly dataDir?: string;
		readonly password?: string;
		readonly open?: boolean;
		readonly cert?: string;
		readonly certKey?: string;
		readonly socket?: string;

		readonly installExtension?: string;

		readonly bootstrapFork?: string;
		readonly extraArgs?: string;
	};

	// Convert deprecated host and port args to a bind option.
	if (options.host || options.port) {
		if (options.bind !== [defaultBindAddress]) {
			logger.error("'--host' and/or '--port' arguments cannot be supplied alongside '--bind'.");
			process.exit(1);
		}

		const host = options.host || defaultHost;
		const port = options.port || defaultPort;
		const bind = `${host}:${port}`;
		logger.warn(`The '--host' and '--port' arguments are deprecated. Use '--bind "${bind}"' instead.`);
		options.bind = [bind];
	}

	// Ensure custom bind args aren't supplied alongside a socket arg.
	if (options.socket && options.bind !== [defaultBindAddress]) {
		logger.error("'--bind' arguments cannot be supplied alongside '--socket'.");
		process.exit(1);
	}

	// Parse bind addresses.
	let bindAddresses: BindAddress[] = [];
	try {
		bindAddresses = options.bind.map(parseBindAddress);
	} catch (ex) {
		logger.error(`Failed to parse bind addresses: ${ex.message}`);
		process.exit(1);
	}

	// Remove duplicate bind addresses (to help avoid EADDRINUSE). This does
	// not check for duplicates like 0.0.0.0:80 and 127.0.0.1:80, or
	// localhost:80 and 127.0.0.1:80.
	bindAddresses = bindAddresses.filter((addr, i, self) => {
		if (addr.port === 0) {
			return true;
		}
		for (let j = i+1; j < bindAddresses.length; j++) {
			if (i === j) {
				continue;
			}
			let addr2 = bindAddresses[j];

			if (addr.host === addr2.host && addr.port === addr2.port) {
				return false;
			}
		}

		return true;
	});

	if (options.disableTelemetry) {
		process.env.DISABLE_TELEMETRY = "true";
	}

	// Commander has an exception for `--no` prefixes. Here we'll adjust that.
	// tslint:disable-next-line:no-any
	const noAuthValue = (commander as any).auth;
	options.noAuth = !noAuthValue;

	const dataDir = path.resolve(options.userDataDir || options.dataDir || path.join(dataHome, "code-server"));
	const extensionsDir = options.extensionsDir ? path.resolve(options.extensionsDir) : path.resolve(dataDir, "extensions");
	const builtInExtensionsDir = path.resolve(buildDir || path.join(__dirname, ".."), "build/extensions");
	const extraExtensionDirs = options.extraExtensionsDir ? options.extraExtensionsDir.map((p) => path.resolve(p)) : [];
	const extraBuiltinExtensionDirs = options.extraBuiltinExtensionsDir ? options.extraBuiltinExtensionsDir.map((p) => path.resolve(p)) : [];
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
		...extraExtensionDirs.map((p) => fse.mkdirp(p)),
		...extraBuiltinExtensionDirs.map((p) => fse.mkdirp(p)),
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
		], withEnv({ env: { VSCODE_ALLOW_IO: "true" } }), dataDir);

		fork.stdout.on("data", (d: Buffer) => d.toString().split("\n").forEach((l) => logger.info(l)));
		fork.stderr.on("data", (d: Buffer) => d.toString().split("\n").forEach((l) => logger.error(l)));
		fork.on("exit", () => process.exit());

		return;
	}

	// TODO: fill in appropriate doc url
	logger.info("Additional documentation: http://github.com/cdr/code-server");
	logger.info("Initializing", field("data-dir", dataDir), field("extensions-dir", extensionsDir), field("working-dir", workingDir), field("log-dir", logDir));
	const sharedProcess = new SharedProcess(dataDir, extensionsDir, builtInExtensionsDir, extraExtensionDirs, extraBuiltinExtensionDirs);
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
	const usingCustomPassword = !!password;
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
			extraExtensionDirectories: extraExtensionDirs,
			extraBuiltinExtensionDirectories: extraBuiltinExtensionDirs,
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

	logger.info(" ");
	if (options.socket) {
		logger.info("Starting webserver via socket...", field("socket", options.socket));
		const server = app.createServer();
		server.on("error", (err: NodeJS.ErrnoException) => {
			if (err.code === "EADDRINUSE") {
				logger.error(`Socket ${bold(options.socket!)} is in use. Please specify a different socket.`);
				process.exit(1);
			}
			logger.error(err.message);
		});
		server.listen(options.socket, () => {
			logger.info(" ");
			logger.info("Started on socket address:");
			logger.info("    " + options.socket!);
			logger.info(" ");
		});
	} else {
		// Warn about port 80 with no port 443 when allowHttp is false.
		if (!options.allowHttp) {
			const port443Addrs = bindAddresses.filter(addr => addr.port === 443);
			if (!port443Addrs.find(addr => addr.host === "0.0.0.0")) {
				const port80Addrs = bindAddresses.filter(addr => addr.port === 80);
				for (let addr of port80Addrs) {
					if (!port443Addrs.find(a => a.host === addr.host)) {
						logger.warn("Listening on port 80 but not port 443 when '--allow-http' is not supplied could cause your browser to be redirected to port 443 (and fail).");
						logger.warn(`It's likely that you wanted to additionally provide '--bind "${addr.host}:443"' or '--allow-http' when starting code-server.`);
						logger.warn(" ");
						break;
					}
				}
			}
		}

		if (bindAddresses.length > 1) {
			logger.info(`Starting ${bindAddresses.length} listeners...`);
		}
		const protocol = options.allowHttp ? "http" : "https";
		const urls = await Promise.all(bindAddresses.map((addr: BindAddress, i: number): Promise<string> => {
			return new Promise<string>((resolve, reject): void => {
				logger.info(`Starting HTTP${!options.allowHttp ? "(S)" : ""} listener...`,
					field("host", addr.host), field("port", addr.port), field("index", i));

				const server = app.createServer();
				server.on("error", (err: NodeJS.ErrnoException) => {
					if (err.code === "EADDRINUSE") {
						logger.error(`Bind address ${bold(addr.host + ":" + addr.port)} is in use. Please free up the port or specify a different port with the '--bind' flag.`);
						process.exit(1);
					}
					logger.error(err.message);
				});

				server.listen(addr.port, addr.host, () => {
					const address = server.address();
					let host = typeof address === "string" ? addr.host : address.address;
					if (host === "0.0.0.0" || host === "127.0.0.1") {
						host = "localhost";
					}
					const port = typeof address === "string" ? addr.port : address.port;
					const url = `${protocol}://${host}:${port}/`;
					resolve(url);
				});
			});
		}));

		logger.info(" ");
		logger.info("Started (click the links below to open):");
		for (let url of urls) {
			logger.info("    " + url);
		}
		logger.info(" ");

		if (options.open) {
			const url = urls[0];
			try {
				await open(url);
			} catch (e) {
				logger.warn("URL couldn't be opened automatically.", field("url", url), field("error", e.message));
			}
		}
	}

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
	if (!options.certKey && !options.cert) {
		logger.warn("No certificate specified. \u001B[1mThis could be insecure.");
		// TODO: fill in appropriate doc url
		logger.warn("Documentation on securing your setup: https://github.com/cdr/code-server/blob/master/doc/security/ssl.md");
	}

	logger.info(" ");
	if (!options.noAuth) {
		logger.info(usingCustomPassword ? "Using custom password." : `Password:\u001B[1m ${password}`);
	} else {
		logger.warn("Launched without authentication.");
	}
	logger.info(" ");
	if (options.disableTelemetry) {
		logger.info("Telemetry is disabled.");
		logger.info(" ");
	}
})().catch((ex) => {
	logger.error(ex);
});
