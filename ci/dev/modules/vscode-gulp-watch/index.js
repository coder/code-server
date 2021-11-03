'use strict';
const assign = require('object-assign');
const path = require('path');
const PluginError = require('plugin-error');
const fancyLog = require('fancy-log');
const colors = require('ansi-colors');
const chokidar = require('chokidar');
const Duplex = require('readable-stream').Duplex;
const vinyl = require('vinyl-file');
const File = require('vinyl');
const anymatch = require('anymatch');
const globParent = require('glob-parent');
const normalize = require('normalize-path');

function normalizeGlobs(globs) {
	if (!globs) {
		throw new PluginError('gulp-watch', 'glob argument required');
	}

	if (typeof globs === 'string') {
		globs = [globs];
	}

	if (!Array.isArray(globs)) {
		throw new PluginError('gulp-watch', 'glob should be String or Array, not ' + (typeof globs));
	}

	return globs;
}

function watch(globs, options, cb) {
	const originalGlobs = globs;
	globs = normalizeGlobs(globs);

	if (typeof options === 'function') {
		cb = options;
		options = {};
	}

	options = assign({}, watch._defaultOptions, options);
	cb = cb || function () {};

	function resolveFilepath(filepath) {
		if (path.isAbsolute(filepath)) {
			return path.normalize(filepath);
		}

		return path.resolve(options.cwd || process.cwd(), filepath);
	}

	function resolveGlob(glob) {
		let mod = '';

		if (glob[0] === '!') {
			mod = glob[0];
			glob = glob.slice(1);
		}

		return mod + normalize(resolveFilepath(glob));
	}

	globs = globs.map(glob => resolveGlob(glob));

	const baseForced = Boolean(options.base);
	const outputStream = new Duplex({objectMode: true, allowHalfOpen: true});

	outputStream._write = function (file, enc, done) {
		cb(file);
		this.push(file);
		done();
	};

	outputStream._read = function () { };

	const watcher = chokidar.watch(globs, options);

	options.events.forEach(ev => {
		watcher.on(ev, processEvent.bind(undefined, ev));
	});

	['add', 'change', 'unlink', 'addDir', 'unlinkDir', 'error', 'ready', 'raw']
		.forEach(ev => {
			watcher.on(ev, outputStream.emit.bind(outputStream, ev));
		});

	outputStream.add = function (newGlobs) {
		newGlobs = normalizeGlobs(newGlobs)
			.map(glob => resolveGlob(glob));
		watcher.add(newGlobs);
		globs.push(...newGlobs);
	};

	outputStream.unwatch = watcher.unwatch.bind(watcher);
	outputStream.close = function () {
		watcher.close();
		this.emit('end');
	};

	function processEvent(event, filepath) {
		filepath = resolveFilepath(filepath);
		const fileOptions = assign({}, options);

		let glob;
		let currentFilepath = filepath;
		while (!(glob = globs[anymatch(globs, currentFilepath, true)]) && currentFilepath !== (currentFilepath = path.dirname(currentFilepath))) {} // eslint-disable-line no-empty

		if (!glob) {
			fancyLog.info(
				colors.cyan('[gulp-watch]'),
				colors.yellow('Watched unexpected path. This is likely a bug. Please open this link to report the issue:\n') +
				'https://github.com/floatdrop/gulp-watch/issues/new?title=' +
				encodeURIComponent('Watched unexpected filepath') + '&body=' +
				encodeURIComponent('Node.js version: `' + process.version + ' ' + process.platform + ' ' + process.arch + '`\ngulp-watch version: `' + require('./package.json').version + '`\nGlobs: `' + JSON.stringify(originalGlobs) + '`\nFilepath: `' + filepath + '`\nEvent: `' + event + '`\nProcess CWD: `' + process.cwd() + '`\nOptions:\n```js\n' + JSON.stringify(options, null, 2) + '\n```')
			);
			return;
		}

		if (!baseForced) {
			fileOptions.base = path.normalize(globParent(glob));
		}

		// Do not stat deleted files
		if (event === 'unlink' || event === 'unlinkDir') {
			fileOptions.path = filepath;

			write(event, null, new File(fileOptions));
			return;
		}

		// Workaround for early read
		setTimeout(() => {
			vinyl.read(filepath, fileOptions).then(file => {
				write(event, null, file);
			});
		}, options.readDelay);
	}

	function write(event, err, file) {
		if (err) {
			outputStream.emit('error', err);
			return;
		}

		if (options.verbose) {
			log(event, file);
		}

		file.event = event;
		outputStream.push(file);
		cb(file);
	}

	function log(event, file) {
		event = event[event.length - 1] === 'e' ? event + 'd' : event + 'ed';

		const message = [colors.magenta(file.relative), 'was', event];

		if (options.name) {
			message.unshift(colors.cyan(options.name) + ' saw');
		}

		fancyLog.info.apply(null, message);
	}

	return outputStream;
}

// This is not part of the public API as that would lead to global state (singleton) pollution,
// and allow unexpected interference between unrelated modules that make use of gulp-watch.
// This can be useful for unit tests and root application configuration, though.
// Avoid modifying gulp-watch's default options inside a library/reusable package, please.
watch._defaultOptions = {
	events: ['add', 'change', 'unlink'],
	ignoreInitial: true,
	readDelay: 10
};

module.exports = watch;
