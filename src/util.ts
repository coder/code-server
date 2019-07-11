import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as util from "util";

import { getPathFromAmdModule } from "vs/base/common/amd";
import { URITransformer, IRawURITransformer } from "vs/base/common/uriIpc";
import { mkdirp } from "vs/base/node/pfs";

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

	await mkdirp(tmpdir);

	if (!exists[0] || !exists[1]) {
		const pem = require.__$__nodeRequire(path.resolve(__dirname, "../node_modules/pem/lib/pem")) as typeof import("pem");
		const certs = await new Promise<import("pem").CertificateCreationResult>((resolve, reject): void => {
			pem.createCertificate({ selfSigned: true }, (error, result) => {
				if (error) {
					return reject(error);
				}
				resolve(result);
			});
		});
		await Promise.all([
			util.promisify(fs.writeFile)(paths.cert, certs.certificate),
			util.promisify(fs.writeFile)(paths.certKey, certs.serviceKey),
		]);
	}

	return paths;
};

let secure: boolean;
export const useHttpsTransformer = (): void => {
	secure = true;
};

export const uriTransformerPath = (): string => {
	return getPathFromAmdModule(
		require,
		"vs/server/src/uriTransformerHttp" + (secure ? "s": ""),
	);
};

export const getUriTransformer = (remoteAuthority: string): URITransformer => {
	const rawURITransformerFactory = <any>require.__$__nodeRequire(uriTransformerPath());
	const rawURITransformer = <IRawURITransformer>rawURITransformerFactory(remoteAuthority);
	return new URITransformer(rawURITransformer);
};
