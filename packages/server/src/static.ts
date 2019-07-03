import { field, logger } from "@coder/logger";
import * as getETag from "etag";
import * as express from "express";
import * as fs from "fs";
import * as mime from "mime-types";
import * as path from "path";
import * as serveStatic from "serve-static";
import * as zlib from "zlib";

const defaultContentType = "application/octet-stream";

interface FileData {
	readonly etag: string;
	readonly lastModified: Date;
}

const listGzFilesRecursive = (rootFolder: string, subFolder: string): { [s: string]: FileData } => {
	let files: { [s: string]: FileData } = {};

	const fullDir = path.join(rootFolder, subFolder);
	const contents = fs.readdirSync(fullDir);
	for (let file of contents) {
		let filePath = path.join(subFolder, file);
		const fileFullPath = path.join(fullDir, file);

		const stats = fs.statSync(fileFullPath);
		if (stats.isDirectory()) {
			files = { ...files, ...listGzFilesRecursive(rootFolder, filePath) };
		} else if (filePath.endsWith(".gz")) {
			try {
				filePath = filePath.replace(/\.gz$/i, "");
				const etag = getETag(stats);
				const mtime = Math.round(stats.mtime/1000)*1000;
				const lastModified = new Date(mtime);
				files[filePath] = { etag, lastModified };
			} catch (err) {
				logger.warn("failed to stat file in listGzFilesRecursive", field("filePath", fileFullPath), field("error", err.message));
			}
		}
	}

	return files;
};

const setPath = (req: express.Request, path: string): void => {
	let query = req.url.split("?").splice(1).join("?");
	if (query !== "") {
		query = "?" + query;
	}
	req.url = path + query;
};

// staticGzip returns middleware that serves pre-gzipped files from rootFolder.
// If the client doesn't support gzipped responses, the file will be
// gunzipped. After initializing staticGzip, files in rootFolder shouldn't be
// modified (and new files shouldn't be added) as changes won't be reflected in
// responses.
export const staticGzip = (rootFolder: string): express.RequestHandler => {
	if (!fs.existsSync(rootFolder)) {
		throw new Error("staticGzip: rootFolder does not exist");
	}

	const expressStatic = serveStatic(rootFolder);
	const gzipFiles = listGzFilesRecursive(rootFolder, "/");

	return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
		if (req.method !== "GET" && req.method !== "HEAD") {
			return next();
		}

		if (req.path.endsWith("/")) {
			setPath(req, req.path + "index.html");
		}

		// Check for 404, and let expressStatic handle it if it is. This
		// also allows for clients to download raw .gz files or files that aren't gzipped.
		if (!gzipFiles.hasOwnProperty(req.path)) {
			return expressStatic(req, res, next);
		}

		// If we're going to try serving a gzip using serve-static, we
		// need to remove the 'Range' header as you can't gunzip partial
		// gzips. Unfourtunately, 'Accept-Ranges' is still returned in serve-static responses.
		req.headers["range"] = "";

		let contentType = mime.contentType(path.extname(req.path));
		if (contentType === false) {
			contentType = defaultContentType;
		}
		res.setHeader("Content-Type", contentType);
		res.setHeader("Vary", "Accept-Encoding");

		// Send .gz file directly from disk.
		if (req.acceptsEncodings("gzip")) {
			setPath(req, req.path + ".gz");
			res.setHeader("Content-Encoding", "gzip");

			return expressStatic(req, res, next);
		}

		const filePath = path.join(rootFolder, req.path + ".gz");
		const fileData = gzipFiles[req.path];

		// Set 'ETag' and 'Last-Modified' headers.
		res.setHeader("ETag", fileData.etag);
		res.setHeader("Last-Modified", fileData.lastModified.toUTCString());

		// Try to send 304 Not Modified response by checking 'If-Match'
		// and 'If-Modified-Since' headers.
		const ifMatch = req.get("if-match");
		const ifModifiedSince = req.get("if-modified-since");
		if (ifMatch === fileData.etag) {
			res.status(304); // Not Modified

			return res.end();
		}
		if (ifModifiedSince) {
			const ifModifiedSinceDate = new Date(ifModifiedSince);
			if (fileData.lastModified.getTime() <= ifModifiedSinceDate.getTime()) {
				res.status(304); // Not Modified

				return res.end();
			}
		}

		// Gunzip and return stream. We don't know the resulting
		// filesize, so we don't set 'Content-Length'.
		try {
			const file = fs.createReadStream(filePath);
			const gunzip = zlib.createGunzip();
			const stream = gunzip.pipe(res);
			stream.on("end", () => {
				file.close();
				gunzip.close();
				res.end();
			});
			file.pipe(gunzip);
		} catch (err) {
			next(err);
		}
	};
};
