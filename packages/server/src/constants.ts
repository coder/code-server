import * as path from "path";
import * as os from "os";

export const isCli = typeof process.env.CLI !== "undefined" && process.env.CLI !== "false";
export const serveStatic = typeof process.env.SERVE_STATIC !== "undefined" && process.env.SERVE_STATIC !== "false";
export const buildDir = process.env.BUILD_DIR ? path.resolve(process.env.BUILD_DIR) : "";
const xdgResolve = (primary: string | undefined, fallback: string): string => {
	return primary ? path.resolve(primary) : path.resolve(process.env.HOME || os.homedir(), fallback);
};
export const dataHome = xdgResolve(process.env.XDG_DATA_HOME, ".local/share");
export const cacheHome = xdgResolve(process.env.XDG_CACHE_HOME, ".cache");
