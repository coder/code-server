import * as cp from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as util from "util";
import * as rg from "vscode-ripgrep";

import { getPathFromAmdModule } from "vs/base/common/amd";
import { getMediaMime as vsGetMediaMime } from "vs/base/common/mime";
import { extname } from "vs/base/common/path";
import { URITransformer, IRawURITransformer } from "vs/base/common/uriIpc";
import { mkdirp } from "vs/base/node/pfs";

export enum AuthType {
	Password = "password",
	None = "none",
}

export enum FormatType {
	Json = "json",
}

export const tmpdir = path.join(os.tmpdir(), "code-server");

export const generateCertificate = async (): Promise<{ cert: string, certKey: string }> => {
	const paths = {
		cert: path.join(tmpdir, "self-signed.cert"),
		certKey: path.join(tmpdir, "self-signed.key"),
	};

	const exists = await Promise.all([
		util.promisify(fs.exists)(paths.cert),
		util.promisify(fs.exists)(paths.certKey),
	]);

	if (!exists[0] || !exists[1]) {
		const pem = localRequire<typeof import("pem")>("pem/lib/pem");
		const certs = await new Promise<import("pem").CertificateCreationResult>((resolve, reject): void => {
			pem.createCertificate({ selfSigned: true }, (error, result) => {
				if (error) {
					return reject(error);
				}
				resolve(result);
			});
		});
		await mkdirp(tmpdir);
		await Promise.all([
			util.promisify(fs.writeFile)(paths.cert, certs.certificate),
			util.promisify(fs.writeFile)(paths.certKey, certs.serviceKey),
		]);
	}

	return paths;
};

export const uriTransformerPath = getPathFromAmdModule(require, "vs/server/src/node/uriTransformer");
export const getUriTransformer = (remoteAuthority: string): URITransformer => {
	const rawURITransformerFactory = <any>require.__$__nodeRequire(uriTransformerPath);
	const rawURITransformer = <IRawURITransformer>rawURITransformerFactory(remoteAuthority);
	return new URITransformer(rawURITransformer);
};

export const generatePassword = async (length: number = 24): Promise<string> => {
	const buffer = Buffer.alloc(Math.ceil(length / 2));
	await util.promisify(crypto.randomFill)(buffer);
	return buffer.toString("hex").substring(0, length);
};

export const hash = (str: string): string => {
	return crypto.createHash("sha256").update(str).digest("hex");
};

export const getMediaMime = (filePath?: string): string => {
	return filePath && (vsGetMediaMime(filePath) || (<{[index: string]: string}>{
		".css": "text/css",
		".html": "text/html",
		".js": "application/javascript",
		".json": "application/json",
	})[extname(filePath)]) || "text/plain";
};

export const isWsl = async (): Promise<boolean> => {
	return process.platform === "linux"
		&& os.release().toLowerCase().indexOf("microsoft") !== -1
		|| (await util.promisify(fs.readFile)("/proc/version", "utf8"))
			.toLowerCase().indexOf("microsoft") !== -1;
};

export const open = async (url: string): Promise<void> => {
	const args = <string[]>[];
	const options = <cp.SpawnOptions>{};
	const platform = await isWsl() ? "wsl" : process.platform;
	let command = platform === "darwin" ? "open" : "xdg-open";
	if (platform === "win32" || platform === "wsl") {
		command = platform === "wsl" ? "cmd.exe" : "cmd";
		args.push("/c", "start", '""', "/b");
		url = url.replace(/&/g, "^&");
	}
	const proc = cp.spawn(command, [...args, url], options);
	await new Promise((resolve, reject) => {
		proc.on("error", reject);
		proc.on("close", (code) => {
			return code !== 0
				? reject(new Error(`Failed to open with code ${code}`))
				: resolve();
		});
	});
};

/**
 * Extract executables to the temporary directory. This is required since we
 * can't execute binaries stored within our binary.
 */
export const unpackExecutables = async (): Promise<void> => {
	const rgPath = (rg as any).binaryRgPath;
	const destination = path.join(tmpdir, path.basename(rgPath || ""));
	if (rgPath && !(await util.promisify(fs.exists)(destination))) {
		await mkdirp(tmpdir);
		await util.promisify(fs.writeFile)(destination, await util.promisify(fs.readFile)(rgPath));
		await util.promisify(fs.chmod)(destination, "755");
	}
};

export const enumToArray = (t: any): string[] => {
	const values = <string[]>[];
	for (const k in t) {
		values.push(t[k]);
	}
	return values;
};

export const buildAllowedMessage = (t: any): string => {
	const values = enumToArray(t);
	return `Allowed value${values.length === 1 ? " is" : "s are"} ${values.map((t) => `'${t}'`).join(", ")}`;
};

/**
 * Require a local module. This is necessary since VS Code's loader only looks
 * at the root for Node modules.
 */
export const localRequire = <T>(modulePath: string): T => {
	return require.__$__nodeRequire(path.resolve(__dirname, "../../node_modules", modulePath));
};
