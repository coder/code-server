import { RequireFS } from "../src/requirefs";
import { TestCaseArray, isMac } from "./requirefs.util";

const toTest = new TestCaseArray();

describe("requirefs", () => {
	for (let i = 0; i < toTest.length(); i++) {
		const testCase = toTest.byID(i);
		if (!isMac && testCase.name === "gtar") {
			break;
		}
		if (isMac && testCase.name === "tar") {
			break;
		}

		describe(testCase.name, () => {
			let rfs: RequireFS;
			beforeAll(async () => {
				rfs = await testCase.rfs;
			});

			it("should parse individual module", () => {
				expect(rfs.require("./individual.js").frog).toEqual("hi");
			});

			it("should parse chained modules", () => {
				expect(rfs.require("./chained-1").text).toEqual("moo");
			});

			it("should parse through subfolders", () => {
				expect(rfs.require("./subfolder").orangeColor).toEqual("blue");
			});

			it("should be able to move up directories", () => {
				expect(rfs.require("./subfolder/goingUp").frog).toEqual("hi");
			});

			it("should resolve node_modules", () => {
				expect(rfs.require("./nodeResolve").banana).toEqual("potato");
			});

			it("should access global scope", () => {
				// tslint:disable-next-line no-any for testing
				(window as any).coder = {
					test: "hi",
				};
				expect(rfs.require("./scope")).toEqual("hi");
			});

			it("should find custom module", () => {
				rfs.provide("donkey", "ok");
				expect(rfs.require("./customModule")).toEqual("ok");
			});
		});
	}
});
