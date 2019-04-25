import fetch from "node-fetch";
import { GoogleCloudBucket } from "./gcloud";

describe("gcloud bucket", () => {
	const bucket = new GoogleCloudBucket();

	const expectObjectContent = async (objUrl: string, content: string): Promise<void> => {
		expect(await fetch(objUrl).then((resp) => resp.text())).toEqual(content);
	};

	const expectWrite = async (path: string, content: string): Promise<string> => {
		const publicUrl = await bucket.write(path, Buffer.from(content), true);
		await expectObjectContent(publicUrl, content);

		return publicUrl;
	};

	it("should write file", async () => {
		await expectWrite("/test", "hi");
	});
});
