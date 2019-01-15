import { ReadWriteConnection } from "@coder/protocol";
import { Server, ServerOptions } from "@coder/protocol/src/node/server";
import * as express from "express";
import * as http from "http";
import * as ws from "ws";

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
	
	wss.on("connection", (ws: WebSocket) => {
		const connection: ReadWriteConnection = {
			onMessage: (cb) => {
				ws.addEventListener("message", (event) => cb(event.data));
			},
			close: () => ws.close(),
			send: (data) => ws.send(data),
			onClose: (cb) => ws.addEventListener("close", () => cb()),
		};
	
		const server = new Server(connection, options);
	});

	/**
	 * We should static-serve the `web` package at this point
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
