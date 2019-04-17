import { field, logger } from "@coder/logger";
import { ReadWriteConnection } from "@coder/protocol";
import { Server, ServerOptions } from "@coder/protocol/src/node/server";
import { TunnelCloseCode } from "@coder/tunnel/src/common";
import { handle as handleTunnel } from "@coder/tunnel/src/server";
import * as express from "express";
//@ts-ignore
import * as expressStaticGzip from "express-static-gzip";
import * as fs from "fs";
import { mkdirp } from "fs-extra";
import * as http from "http";
//@ts-ignore
import * as httpolyglot from "httpolyglot";
import * as https from "https";
import * as mime from "mime-types";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import * as pem from "pem";
import * as util from "util";
import * as url from "url";
import * as ws from "ws";
import { buildDir } from "./constants";
import { createPortScanner } from "./portScanner";
import safeCompare = require("safe-compare");

interface CreateAppOptions {
	registerMiddleware?: (app: express.Application) => void;
	serverOptions?: ServerOptions;
	password?: string;
	httpsOptions?: https.ServerOptions;
	allowHttp?: boolean;
	bypassAuth?: boolean;
}

export const createApp = async (options: CreateAppOptions): Promise<{
	readonly express: express.Application;
	readonly server: http.Server;
	readonly wss: ws.Server;
}> => {
	const parseCookies = (req: http.IncomingMessage): { [key: string]: string } => {
		const cookies: { [key: string]: string } = {};
		const rc = req.headers.cookie;
		if (rc) {
			rc.split(";").forEach((cook) => {
				const parts = cook.split("=");
				cookies[parts.shift()!.trim()] = decodeURI(parts.join("="));
			});
		}

		return cookies;
	};

	const ensureAuthed = (req: http.IncomingMessage, res: express.Response): boolean => {
		if (!isAuthed(req)) {
			res.status(401);
			res.end();

			return false;
		}

		return true;
	};

	const isAuthed = (req: http.IncomingMessage): boolean => {
		try {
			if (!options.password || options.bypassAuth) {
				return true;
			}

			// Try/catch placed here just in case
			const cookies = parseCookies(req);
			if (cookies.password && safeCompare(cookies.password, options.password)) {
				return true;
			}
		} catch (ex) {
			logger.error("Failed to parse cookies", field("error", ex));
		}

		return false;
	};

	const isEncrypted = (socket: net.Socket): boolean => {
		if (options.bypassAuth) {
			return true;
		}

		// tslint:disable-next-line:no-any
		return (socket as any).encrypted;
	};

	const app = express();
	if (options.registerMiddleware) {
		options.registerMiddleware(app);
	}

	interface CertificateInfo {
		readonly key: string;
		// tslint:disable-next-line:no-any
		readonly cert: any;
	}

	const certs = await new Promise<CertificateInfo>(async (resolve, reject): Promise<void> => {
		const selfSignedKeyPath = path.join(options.serverOptions!.dataDirectory, "self-signed.key");
		const selfSignedCertPath = path.join(options.serverOptions!.dataDirectory, "self-signed.cert");

		if (!fs.existsSync(selfSignedKeyPath) || !fs.existsSync(selfSignedCertPath)) {
			try {
				const certs = await new Promise<pem.CertificateCreationResult>((res, rej): void => {
					pem.createCertificate({
						selfSigned: true,
					}, (err, result) => {
						if (err) {
							rej(err);

							return;
						}

						res(result);
					});
				});

				fs.writeFileSync(selfSignedKeyPath, certs.serviceKey);
				fs.writeFileSync(selfSignedCertPath, certs.certificate);
			} catch (ex) {
				return reject(ex);
			}
		}

		resolve({
			cert: fs.readFileSync(selfSignedCertPath).toString(),
			key: fs.readFileSync(selfSignedKeyPath).toString(),
		});
	});

	const server = httpolyglot.createServer(options.bypassAuth ? {} : options.httpsOptions || certs, app) as http.Server;
	const wss = new ws.Server({ server });

	wss.shouldHandle = (req): boolean => {
		return isAuthed(req);
	};

	const portScanner = createPortScanner();
	wss.on("connection", async (ws, req) => {
		if (req.url && req.url.startsWith("/tunnel")) {
			try {
				const rawPort = req.url.split("/").pop();
				const port = Number.parseInt(rawPort!, 10);

				await handleTunnel(ws, port);
			} catch (ex) {
				ws.close(TunnelCloseCode.Error, ex.toString());
			}

			return;
		}

		if (req.url && req.url.startsWith("/ports")) {
			const onAdded = portScanner.onAdded((added) => ws.send(JSON.stringify({ added })));
			const onRemoved = portScanner.onRemoved((removed) => ws.send(JSON.stringify({ removed })));
			ws.on("close", () => {
				onAdded.dispose();
				onRemoved.dispose();
			});

			return ws.send(JSON.stringify({ ports: portScanner.ports }));
		}

		const connection: ReadWriteConnection = {
			onMessage: (cb): void => {
				ws.addEventListener("message", (event) => cb(event.data));
			},
			close: (): void => ws.close(),
			send: (data): void => {
				if (ws.readyState !== ws.OPEN) {
					return;
				}
				try {
					ws.send(data);
				} catch (error) {
					logger.error(error.message);
				}
			},
			onUp: (): void => undefined, // This can't come back up.
			onDown: (cb): void => ws.addEventListener("close", () => cb()),
			onClose: (cb): void => ws.addEventListener("close", () => cb()),
		};

		// tslint:disable-next-line no-unused-expression
		new Server(connection, options.serverOptions);
	});

	const redirect = (
		req: express.Request, res: express.Response,
		to: string = "", from: string = "",
		code: number = 302, protocol: string = req.protocol,
	): void => {
		const currentUrl = `${protocol}://${req.headers.host}${req.originalUrl}`;
		const newUrl = url.parse(currentUrl);
		if (from && newUrl.pathname) {
			newUrl.pathname = newUrl.pathname.replace(new RegExp(`\/${from}\/?$`), "/");
		}
		if (to) {
			newUrl.pathname = (newUrl.pathname || "").replace(/\/$/, "") + `/${to}`;
		}
		newUrl.path = undefined; // Path is not necessary for format().
		const newUrlString = url.format(newUrl);
		logger.trace(`Redirecting from ${currentUrl} to ${newUrlString}`);

		return res.redirect(code, newUrlString);
	};

	const baseDir = buildDir || path.join(__dirname, "..");
	const staticGzip = expressStaticGzip(path.join(baseDir, "build/web"));

	app.use((req, res, next) => {
		logger.trace(`\u001B[1m${req.method} ${res.statusCode} \u001B[0m${req.originalUrl}`, field("host", req.hostname), field("ip", req.ip));

		// Force HTTPS unless allowing HTTP.
		if (!isEncrypted(req.socket) && !options.allowHttp) {
			return redirect(req, res, "", "", 301, "https");
		}

		next();
	});

	// @ts-ignore
	app.use((err, _req, _res, next) => {
		logger.error(err.message);
		next();
	});

	// If not authenticated, redirect to the login page.
	app.get("/", (req, res, next) => {
		if (!isAuthed(req)) {
			return redirect(req, res, "login");
		}
		next();
	});

	// If already authenticated, redirect back to the root.
	app.get("/login", (req, res, next) => {
		if (isAuthed(req)) {
			return redirect(req, res, "", "login");
		}
		next();
	});

	// For getting general server data.
	app.get("/ping", (_req, res) => {
		res.json({
			hostname: os.hostname(),
		});
	});

	// For getting a resource on disk.
	app.get("/resource/:url(*)", async (req, res) => {
		if (!ensureAuthed(req, res)) {
			return;
		}

		try {
			const fullPath = `/${req.params.url}`;
			// const relative = path.relative(options!.dataDirectory, fullPath);
			// if (relative.startsWith("..")) {
			// 	return res.status(403).end();
			// }
			const exists = fs.existsSync(fullPath);
			if (!exists) {
				return res.status(404).end();
			}
			const stat = await util.promisify(fs.stat)(fullPath);
			if (!stat.isFile()) {
				res.write("Resource must be a file.");
				res.status(422);

				return res.end();
			}
			let mimeType = mime.lookup(fullPath);
			if (mimeType === false) {
				mimeType = "application/octet-stream";
			}
			const content = await util.promisify(fs.readFile)(fullPath);

			res.writeHead(200, {
				"Content-Type": mimeType,
				"Content-Length": content.byteLength,
			});
			res.write(content);
			res.end();
		} catch (ex) {
			res.write(ex.toString());
			res.status(500);
			res.end();
		}
	});

	// For writing a resource to disk.
	app.post("/resource/:url(*)", async (req, res) => {
		if (!ensureAuthed(req, res)) {
			return;
		}

		try {
			const fullPath = `/${req.params.url}`;

			const data: string[] = [];
			req.setEncoding("utf8");
			req.on("data", (chunk) => {
				data.push(chunk);
			});
			req.on("end", async () => {
				const body = data.join("");
				await mkdirp(path.dirname(fullPath));
				fs.writeFileSync(fullPath, body);
				logger.info("Wrote resource", field("path", fullPath), field("content-length", body.length));
				res.status(200);
				res.end();
			});
		} catch (ex) {
			res.write(ex.toString());
			res.status(500);
			res.end();
		}
	});

	// Everything else just pulls from the static build directory.
	app.use(staticGzip);

	return {
		express: app,
		server,
		wss,
	};
};
