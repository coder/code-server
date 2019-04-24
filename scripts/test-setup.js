const fs = require("fs");
const util = require("util");

// This isn't properly promisified in Jest.
Object.defineProperty(fs.read, util.promisify.custom, {
	configurable: true,
	value: (...args) => {
		return new Promise((resolve, reject) => {
			args.push((error, bytesRead, buffer) => {
				if (error) {
					reject(error);
				} else {
					resolve({ bytesRead, buffer });
				}
			});
			fs.read(...args);
		});
	},
});

global.requestAnimationFrame = (cb) => {
	setTimeout(cb, 0);
};

// lchmod might not be available. Jest runs graceful-fs which makes this a no-op
// when it doesn't exist but that doesn't seem to always run when running
// multiple tests (or maybe it gets undone after a test).
if (!fs.lchmod) {
	fs.lchmod = function (path, mode, cb) {
		if (cb) {
			process.nextTick(cb);
		}
	};
	fs.lchmodSync = function () {};
}
