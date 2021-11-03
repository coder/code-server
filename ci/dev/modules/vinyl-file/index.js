'use strict';
const path = require('path');
const fs = require('graceful-fs');
const stripBomBuf = require('strip-bom-buf');
const stripBomStream = require('strip-bom-stream');
const File = require('vinyl');
const pify = require('pify');

const fsP = pify(fs);

exports.read = (pth, opts) => {
	opts = opts || {};

	const cwd = opts.cwd || process.cwd();
	const base = opts.base || cwd;

	pth = path.resolve(cwd, pth);

	return fsP.stat(pth).then(stat => {
		const file = new File({
			cwd,
			base,
			path: pth,
			stat
		});

		if (opts.read === false) {
			return file;
		}

		if (opts.buffer === false) {
			file.contents = fs.createReadStream(pth).pipe(stripBomStream());
			return file;
		}

		return fsP.readFile(pth).then(contents => {
			file.contents = stripBomBuf(contents);
			return file;
		});
	});
};

exports.readSync = (pth, opts) => {
	opts = opts || {};

	const cwd = opts.cwd || process.cwd();
	const base = opts.base || cwd;

	pth = path.resolve(cwd, pth);

	let contents;

	if (opts.read !== false) {
		contents = opts.buffer === false ?
			fs.createReadStream(pth).pipe(stripBomStream()) :
			stripBomBuf(fs.readFileSync(pth));
	}

	return new File({
		cwd,
		base,
		path: pth,
		stat: fs.statSync(pth),
		contents
	});
};
