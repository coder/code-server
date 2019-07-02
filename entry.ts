import { MainServer, WebviewServer } from "./server";

const webviewServer = new WebviewServer();
const server = new MainServer(webviewServer);
webviewServer.listen(8444).then(async () => {
	await server.listen(8443);
	console.log(`Main server serving ${server.address}`);
	console.log(`Webview server serving ${webviewServer.address}`);
}).catch((error) =>  {
	console.error(error);
	process.exit(1);
});
