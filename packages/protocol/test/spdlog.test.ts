import * as fs from "fs";
import * as util from "util";
import { Module } from "../src/common/proxy";
import { createClient, Helper } from "./helpers";

describe("spdlog", () => {
	const client = createClient();
	const spdlog = client.modules[Module.Spdlog];
	const helper = new Helper("spdlog");

	beforeAll(async () => {
		await helper.prepare();
	});

	it("should log to a file", async () => {
		const file = await helper.createTmpFile();
		const logger = new spdlog.RotatingLogger("test logger", file, 10000, 10);
		logger.trace("trace");
		logger.debug("debug");
		logger.info("info");
		logger.warn("warn");
		logger.error("error");
		logger.critical("critical");
		logger.flush();
		await new Promise((resolve): number | NodeJS.Timer => setTimeout(resolve, 1000));
		expect(await util.promisify(fs.readFile)(file, "utf8"))
			.toContain("critical");
	});

	it("should dispose", () => {
		setTimeout(() => {
			client.dispose();
		}, 100);
	});
});
