import * as zip from "../src/fill/zip";
import * as path from "path";
import * as fs from "fs";
import * as cp from "child_process";
import { CancellationToken } from "vs/base/common/cancellation";

// tslint:disable-next-line:no-any
jest.mock("vs/nls", () => ({ "localize": (...args: any): string => `${JSON.stringify(args)}` }));

describe("zip", () => {
	const tarPath = path.resolve(__dirname, "./test-extension.tar");
	const vsixPath = path.resolve(__dirname, "./test-extension.vsix");
	const extractPath = path.resolve(__dirname, "./.test-extension");

	beforeEach(() => {
		if (!fs.existsSync(extractPath) || path.dirname(extractPath) !== __dirname) {
			return;
		}
		cp.execSync(`rm -rf '${extractPath}'`);
	});

	const resolveExtract = async (archivePath: string): Promise<void> => {
		expect(fs.existsSync(archivePath)).toEqual(true);
		await expect(zip.extract(
			archivePath,
			extractPath,
			{ sourcePath: "extension", overwrite: true },
			CancellationToken.None,
		)).resolves.toBe(undefined);
		expect(fs.existsSync(extractPath)).toEqual(true);
	};

	// tslint:disable-next-line:no-any
	const extract = (archivePath: string): () => any => {
		// tslint:disable-next-line:no-any
		return async (): Promise<any> => {
			await resolveExtract(archivePath);
			expect(fs.existsSync(path.resolve(extractPath, ".vsixmanifest"))).toEqual(true);
			expect(fs.existsSync(path.resolve(extractPath, "package.json"))).toEqual(true);
		};
	};
	it("should extract from tarred VSIX", extract(tarPath), 2000);
	it("should extract from zipped VSIX", extract(vsixPath), 2000);

	// tslint:disable-next-line:no-any
	const buffer = (archivePath: string): () => any => {
		// tslint:disable-next-line:no-any
		return async (): Promise<any> => {
			await resolveExtract(archivePath);
			const manifestPath = path.resolve(extractPath, ".vsixmanifest");
			expect(fs.existsSync(manifestPath)).toEqual(true);
			const manifestBuf = fs.readFileSync(manifestPath);
			expect(manifestBuf.length).toBeGreaterThan(0);
			await expect(zip.buffer(archivePath, "extension.vsixmanifest")).resolves.toEqual(manifestBuf);
		};
	};
	it("should buffer tarred VSIX", buffer(tarPath), 2000);
	it("should buffer zipped VSIX", buffer(vsixPath), 2000);
});
