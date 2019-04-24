import * as fs from "fs";
import * as util from "util";
import { Module } from "../src/common/proxy";
import { createClient, Helper } from "./helpers";

// tslint:disable deprecation to use fs.exists

describe("trash", () => {
	const client = createClient();
	const trash = client.modules[Module.Trash];
	const helper = new Helper("trash");

	beforeAll(async () => {
		await helper.prepare();
	});

	it("should trash a file", async () => {
		const file = await helper.createTmpFile();
		await trash.trash(file);
		expect(await util.promisify(fs.exists)(file)).toBeFalsy();
	});

	it("should dispose", (done) => {
		setTimeout(() => {
			client.dispose();
			done();
		}, 100);
	});
});
