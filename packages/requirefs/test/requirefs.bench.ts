import * as benchmark from "benchmark";
import { performance } from "perf_hooks";
import { TestCaseArray, isMac } from "./requirefs.util";

const files = [
	"./individual.js", "./chained-1", "./subfolder",
	"./subfolder/goingUp", "./nodeResolve",
];
const toBench = new TestCaseArray();

// Limits the amount of time taken for each test,
// but increases uncertainty.
benchmark.options.maxTime = 0.5;

let suite = new benchmark.Suite();
let _start = 0;
const addMany = (names: string[]): benchmark.Suite => {
	for (let name of names) {
		for (let file of files) {
			suite = suite.add(`${name} -> ${file}`, async () => {
				let rfs = await toBench.byName(name).rfs;
				rfs.require(file);
			});
		}
	}
	_start = performance.now();
	return suite;
}
// Returns mean time per operation, in microseconds (10^-6s).
const mean = (c: any): number => {
	return Number((c.stats.mean * 10e+5).toFixed(5));
};

// Swap out the tar command for gtar, when on MacOS.
let testNames = ["zip", "bsdtar", isMac ? "gtar" : "tar"];
addMany(testNames).on("cycle", (event: benchmark.Event) => {
	console.log(String(event.target) + ` (~${mean(event.target)} μs/op)`);
}).on("complete", () => {
	const slowest = suite.filter("slowest").shift();
	const fastest = suite.filter("fastest").shift();
	console.log(`===\nFastest is ${fastest.name} with ~${mean(fastest)} μs/op`);
	if (slowest.name !== fastest.name) {
		console.log(`Slowest is ${slowest.name} with ~${mean(slowest)} μs/op`);
	}
	const d = ((performance.now() - _start)/1000).toFixed(2);
	console.log(`Benchmark took ${d} s`);
})
.run({ "async": true });
