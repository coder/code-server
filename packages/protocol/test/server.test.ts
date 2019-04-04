import { createClient } from "./helpers";

describe("Server", () => {
	const dataDirectory = "/tmp/example";
	const workingDirectory = "/working/dir";
	const builtInExtensionsDirectory = "/tmp/example";
	const cacheDirectory = "/tmp/cache";
	const client = createClient({
		builtInExtensionsDirectory,
		cacheDirectory,
		dataDirectory,
		workingDirectory,
	});

	it("should get init msg", async () => {
		const data = await client.initData;
		expect(data.dataDirectory).toEqual(dataDirectory);
		expect(data.workingDirectory).toEqual(workingDirectory);
		expect(data.builtInExtensionsDirectory).toEqual(builtInExtensionsDirectory);
	});
});
