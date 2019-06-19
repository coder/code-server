import * as path from "path";
import * as os from "os";

/**
 * Application root.
 */
export const rootPath = path.resolve(__dirname, "../../../..");

/**
 * Contains vscode and built-in extensions.
 */
export const libPath = path.join(rootPath, "lib");

/**
 * Place all temporary files here.
 */
export const tmpPath = path.join(os.tmpdir(), "code-server");

const xdgResolve = (primary: string | undefined, fallback: string): string => {
	return primary ? path.resolve(primary) : path.resolve(process.env.HOME || os.homedir(), fallback);
};
export const dataHome = xdgResolve(process.env.XDG_DATA_HOME, ".local/share");
export const cacheHome = xdgResolve(process.env.XDG_CACHE_HOME, ".cache");
