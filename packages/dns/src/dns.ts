import { field, logger } from "@coder/logger";
import * as http from "http";
//@ts-ignore
import * as named from "node-named";
import * as ip from "ip-address";
import { words, wordKeys } from "./words";

import * as dgram from "dgram";

const oldCreate = dgram.createSocket;

// tslint:disable-next-line:no-any
(<any>dgram).createSocket = (_: any, callback: any): dgram.Socket => {
	return oldCreate("udp4", callback);
};

interface DnsQuery {
	name(): string;
	// tslint:disable-next-line:no-any
	addAnswer(domain: string, target: any, ttl: number): void;
}

const dnsServer: {
	listen(port: number, host: string, callback: () => void): void;
	on(event: "query", callback: (query: DnsQuery) => void): void;
	send(query: DnsQuery): void;
} = named.createServer();

const isDev = process.env.NODE_ENV !== "production";
const dnsPort = isDev ? 9999 : 53;
dnsServer.listen(dnsPort, "0.0.0.0", () => {
	logger.info("DNS server started", field("port", dnsPort));
});

dnsServer.on("query", (query) => {
	const domain = query.name();
	const reqParts = domain.split(".");
	if (reqParts.length < 2) {
		dnsServer.send(query);
		logger.info("Invalid request", field("request", domain));

		return;
	}
	const allWords = reqParts.shift()!;
	if (allWords.length > 16) {
		dnsServer.send(query);
		logger.info("Invalid request", field("request", domain));

		return;
	}
	const wordParts = allWords.split(/(?=[A-Z])/);
	const ipParts: string[] = [];
	// Should be left with HowAreYouNow
	for (let i = 0; i < wordParts.length; i++) {
		const part = wordParts[i];
		if (part.length > 4) {
			dnsServer.send(query);
			logger.info("Words too long", field("request", domain));

			return;
		}
		const ipPart = words[part.toLowerCase()];
		if (typeof ipPart === "undefined") {
			dnsServer.send(query);
			logger.info("Word not found in index", field("part", part), field("request", domain));

			return;
		}
		ipParts.push(ipPart.toString());
	}

	const address = new ip.Address4(ipParts.join("."));

	if (address.isValid()) {
		logger.info("Responded with valid address query", field("address", address.address), field("request", domain));
		query.addAnswer(domain, new named.ARecord(address.address), 99999);
	} else {
		logger.warn("Received invalid request", field("request", domain));
	}

	dnsServer.send(query);
});

const httpServer = http.createServer((request, response) => {
	const remoteAddr = request.connection.remoteAddress;
	if (!remoteAddr) {
		response.writeHead(422);
		response.end();

		return;
	}
	const hostHeader = request.headers.host;
	if (!hostHeader) {
		response.writeHead(422);
		response.end();

		return;
	}
	const host = remoteAddr.split(".").map(p => wordKeys[Number.parseInt(p, 10)]).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("");
	logger.info("Resolved host", field("remote-addr", remoteAddr), field("host", host));
	response.writeHead(200);
	response.write(`${host}.${hostHeader}`);
	response.end();
});

const httpPort = isDev ? 3000 : 80;
httpServer.listen(httpPort, "0.0.0.0", () => {
	logger.info("HTTP server started", field("port", httpPort));
});
