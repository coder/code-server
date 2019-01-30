import { createClient } from "./helpers";

describe("Evaluate", () => {
	const client = createClient();

	it("should transfer string", async () => {
		const value = await client.evaluate(function () {
			return "hi";
		});
		
		expect(value).toEqual("hi");
	}, 100);

	it("should compute from string", async () => {
		const start = "ban\%\$\"``a,,,,asdasd";
		const value = await client.evaluate((a) => {
			return a;
		}, start);

		expect(value).toEqual(start);
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

	it("should resolve with promise", async () => {
		const value = await client.evaluate(async () => {
			await new Promise((r) => setTimeout(r, 100));

			return "donkey";
		});

		expect(value).toEqual("donkey");
	}, 250);

	it("should do active process", (done) => {
		const runner = client.run((ae) => {
			ae.on("1", () => {
				ae.emit("2");
				ae.on("3", () => {
					ae.emit("close");
				});
			});
		});
		runner.emit("1");
		runner.on("2", () => runner.emit("3"));
		runner.on("close", () => done());
	});
});