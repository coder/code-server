import { ReadWriteConnection } from "@coder/protocol";
import { Server, ServerOptions } from "@coder/protocol/src/node/server";
import * as express from "express";
import * as http from "http";
import * as ws from "ws";
import * as url from "url";
import { ClientMessage, SharedProcessInitMessage } from '@coder/protocol/src/proto';

export const createApp = (registerMiddleware?: (app: express.Application) => void, options?: ServerOptions): {
	readonly express: express.Application;
	readonly server: http.Server;
	readonly wss: ws.Server;
} => {
	const app = express();
	if (registerMiddleware) {
		registerMiddleware(app);
	}
	const server = http.createServer(app);
	const wss = new ws.Server({ server });

	wss.shouldHandle = (req): boolean => {
		if (typeof req.url === "undefined") {
			return false;
		}

		const parsedUrl = url.parse(req.url, true);
		const sharedProcessInit = parsedUrl.query["shared_process_init"];
		if (typeof sharedProcessInit === "undefined" || Array.isArray(sharedProcessInit)) {
			return false;
		}

		try {
			const msg = ClientMessage.deserializeBinary(Buffer.from(sharedProcessInit, "base64"));
			if (!msg.hasSharedProcessInit()) {
				return false;
			}
			const spm = msg.getSharedProcessInit()!;
			(<any>req).sharedProcessInit = spm;
		} catch (ex) {
			return false;
		}

		return true;
	};

	wss.on("connection", (ws: WebSocket, req) => {
		const spm = (<any>req).sharedProcessInit as SharedProcessInitMessage;
		if (!spm) {
			ws.close();
			return;
		}

		const connection: ReadWriteConnection = {
			onMessage: (cb): void => {
				ws.addEventListener("message", (event) => cb(event.data));
			},
			close: (): void => ws.close(),
			send: (data): void => ws.send(data),
			onClose: (cb): void => ws.addEventListener("close", () => cb()),
		};

		const server = new Server(connection, options);
	});

	/**
	 * We should static-serve the `web` package at this point.
	 */
	app.get("/", (req, res, next) => {
		res.write("Example! :)");
		res.status(200);
		res.end();
	});

	return {
		express: app,
		server,
		wss,
	};
};
