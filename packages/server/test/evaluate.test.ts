import { createClient } from "./helpers";

describe("Evaluate", () => {
	const client = createClient();

	it("should transfer string", async () => {
		const value = await client.evaluate(function () {
			return "hi";
		});
		
		expect(value).toEqual("hi");
	}, 100);

	it("should compute from object", async () => {
		const value = await client.evaluate((arg) => {
			return arg.bananas * 2;
		}, { bananas: 1 });
		
		expect(value).toEqual(2);
	}, 100);

	it("should transfer object", async () => {
		const value = await client.evaluate(() => {
			return { alpha: "beta" };
		});
		
		expect(value.alpha).toEqual("beta");
	}, 100);

	it("should require", async () => {
		const value = await client.evaluate(() => {
			const fs = require("fs") as typeof import("fs");
		
			return Object.keys(fs).filter((f) => f === "readFileSync");
		});

		expect(value[0]).toEqual("readFileSync");
	}, 100);
});