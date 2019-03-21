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
