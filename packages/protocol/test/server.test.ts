import { createClient } from "./helpers";

describe("Server", () => {
	const dataDirectory = "/tmp/example";
	const workingDirectory = "/working/dir";
	const builtInExtensionsDirectory = "/tmp/example";
	const client = createClient({
		dataDirectory,
		workingDirectory,
		builtInExtensionsDirectory,
	});

	it("should get init msg", (done) => {
		client.initData.then((data) => {
			expect(data.dataDirectory).toEqual(dataDirectory);
			expect(data.workingDirectory).toEqual(workingDirectory);
			expect(data.builtInExtensionsDirectory).toEqual(builtInExtensionsDirectory);
			done();
		});
	});
});
