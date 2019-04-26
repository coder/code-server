/**
 * Script that detects platform name and arch.
 * Cannot use os.platform() as that won't detect libc version
 */
import * as cp from "child_process";
import * as fs from "fs";
import * as os from "os";

enum Lib {
	GLIBC,
	MUSL,
}

const CLIB: Lib | undefined = ((): Lib | undefined => {
	if (os.platform() !== "linux") {
		return;
	}
	const glibc = cp.spawnSync("getconf", ["GNU_LIBC_VERSION"]);
	if (glibc.status === 0) {
		return Lib.GLIBC;
	}

	const ldd = cp.spawnSync("ldd", ["--version"]);
	if (ldd.stdout && ldd.stdout.indexOf("musl") !== -1) {
		return Lib.MUSL;
	}

	const muslFile = fs.readdirSync("/lib").find((value) => value.startsWith("libc.musl"));
	if (muslFile) {
		return Lib.MUSL;
	}

	return Lib.GLIBC;
})();

export const platform = (): NodeJS.Platform | "musl" => {
	if (CLIB === Lib.MUSL) {
		return "musl";
	}

	return os.platform();
};
