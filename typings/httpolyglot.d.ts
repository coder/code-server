declare module "httpolyglot" {
	import * as http from "http";
	import * as https from "https";

	function createServer(requestListener?: (req: http.IncomingMessage, res: http.ServerResponse) => void): http.Server;
	function createServer(options: https.ServerOptions, requestListener?: (req: http.IncomingMessage, res: http.ServerResponse) => void): https.Server;
}
