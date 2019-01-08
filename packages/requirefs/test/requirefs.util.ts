import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { fromTar, RequireFS, fromZip } from "../src/requirefs";

export const isMac = os.platform() === "darwin";

/**
 * Encapsulates a RequireFS Promise and the
 * name of the test case it will be used in.
 */
interface TestCase {
	rfs: Promise<RequireFS>;
	name: string;
}

/**
 * TestCaseArray allows tests and benchmarks to share
 * test cases while limiting redundancy.
 */
export class TestCaseArray {
	private cases: Array<TestCase> = [];

	constructor(cases?: Array<TestCase>) {
		if (!cases) {
			this.cases = TestCaseArray.defaults();
			return
		}
		this.cases = cases;
	}

	/**
	 * Returns default test cases. MacOS users need to have `gtar` binary
	 * in order to run GNU-tar tests and benchmarks.
	 */
	public static defaults(): Array<TestCase> {
		let cases: Array<TestCase> = [
			TestCaseArray.newCase("cd lib && zip -r ../lib.zip ./*", "lib.zip", async (c) => fromZip(c), "zip"),
			TestCaseArray.newCase("cd lib && bsdtar cvf ../lib.tar ./*", "lib.tar", async (c) => fromTar(c), "bsdtar"),
		];
		if (isMac) {
			const gtarInstalled: boolean = cp.execSync("which tar").length > 0;
			if (gtarInstalled) {
				cases.push(TestCaseArray.newCase("cd lib && gtar cvf ../lib.tar ./*", "lib.tar", async (c) => fromTar(c), "gtar"));
			} else {
				throw new Error("failed to setup gtar test case, gtar binary is necessary to test GNU-tar on MacOS");
			}
		} else {
			cases.push(TestCaseArray.newCase("cd lib && tar cvf ../lib.tar ./*", "lib.tar", async (c) => fromTar(c), "tar"));
		}
		return cases;
	};

	/**
	 * Returns a test case prepared with the provided RequireFS Promise.
	 * @param command Command to run immediately. For setup.
	 * @param targetFile File to be read and handled by prepare function.
	 * @param prepare Run on target file contents before test.
	 * @param name Test case name.
	 */
	public static newCase(command: string, targetFile: string, prepare: (content: Uint8Array) => Promise<RequireFS>, name: string): TestCase {
		cp.execSync(command, { cwd: __dirname });
		const content = fs.readFileSync(path.join(__dirname, targetFile));
		return {
			name,
			rfs: prepare(content),
		};
	}

	/**
	 * Returns updated TestCaseArray instance, with a new test case.
	 * @see TestCaseArray.newCase
	 */
	public add(command: string, targetFile: string, prepare: (content: Uint8Array) => Promise<RequireFS>, name: string): TestCaseArray {
		this.cases.push(TestCaseArray.newCase(command, targetFile, prepare, name));
		return this;
	};

	/**
	 * Gets a test case by index.
	 * @param id Test case index.
	 */
	public byID(id: number): TestCase {
		if (!this.cases[id]) {
			if (id < 0 || id >= this.cases.length) {
				throw new Error(`test case index "${id}" out of bounds`);
			}
			throw new Error(`test case at index "${id}" not found`);
		}
		return this.cases[id];
	}

	/**
	 * Gets a test case by name.
	 * @param name Test case name.
	 */
	public byName(name: string): TestCase {
		let c = this.cases.find((c) => c.name === name);
		if (!c) {
			throw new Error(`test case "${name}" not found`);
		}
		return c;
	}

	/**
	 * Gets the number of test cases.
	 */
	public length(): number {
		return this.cases.length;
	}
}
