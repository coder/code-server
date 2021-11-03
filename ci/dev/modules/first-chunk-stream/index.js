'use strict';
var util = require('util');
var Duplex = require('readable-stream').Duplex;

function FirstChunkStream(options, cb) {
	var _this = this;
	var _state = {
		sent: false,
		chunks: [],
		size: 0
	};

	if (!(this instanceof FirstChunkStream)) {
		return new FirstChunkStream(options, cb);
	}

	options = options || {};

	if (!(cb instanceof Function)) {
		throw new Error('FirstChunkStream constructor requires a callback as its second argument.');
	}

	if (typeof options.chunkLength !== 'number') {
		throw new Error('FirstChunkStream constructor requires `options.chunkLength` to be a number.');
	}

	if (options.objectMode) {
		throw new Error('FirstChunkStream doesn\'t support `objectMode` yet.');
	}

	Duplex.call(this, options);

	// Initialize the internal state
	_state.manager = createReadStreamBackpressureManager(this);

	// Errors management
	// We need to execute the callback or emit en error dependending on the fact
	// the firstChunk is sent or not
	_state.errorHandler = function firstChunkStreamErrorHandler(err) {
		processCallback(err, Buffer.concat(_state.chunks, _state.size), _state.encoding, function () {});
	};

	this.on('error', _state.errorHandler);

	// Callback management
	function processCallback(err, buf, encoding, done) {
		// When doing sync writes + emiting an errror it can happen that
		// Remove the error listener on the next tick if an error where fired
		// to avoid unwanted error throwing
		if (err) {
			setImmediate(function () {
				_this.removeListener('error', _state.errorHandler);
			});
		} else {
			_this.removeListener('error', _state.errorHandler);
		}

		_state.sent = true;

		cb(err, buf, encoding, function (err, buf, encoding) {
			if (err) {
				setImmediate(function () {
					_this.emit('error', err);
				});
				return;
			}

			if (!buf) {
				done();
				return;
			}

			_state.manager.programPush(buf, encoding, done);
		});
	}

	// Writes management
	this._write = function firstChunkStreamWrite(chunk, encoding, done) {
		_state.encoding = encoding;

		if (_state.sent) {
			_state.manager.programPush(chunk, _state.encoding, done);
		} else if (chunk.length < options.chunkLength - _state.size) {
			_state.chunks.push(chunk);
			_state.size += chunk.length;
			done();
		} else {
			_state.chunks.push(chunk.slice(0, options.chunkLength - _state.size));
			chunk = chunk.slice(options.chunkLength - _state.size);
			_state.size += _state.chunks[_state.chunks.length - 1].length;

			processCallback(null, Buffer.concat(_state.chunks, _state.size), _state.encoding, function () {
				if (!chunk.length) {
					done();
					return;
				}

				_state.manager.programPush(chunk, _state.encoding, done);
			});
		}
	};

	this.on('finish', function firstChunkStreamFinish() {
		if (!_state.sent) {
			return processCallback(null, Buffer.concat(_state.chunks, _state.size), _state.encoding, function () {
				_state.manager.programPush(null, _state.encoding);
			});
		}

		_state.manager.programPush(null, _state.encoding);
	});
}

util.inherits(FirstChunkStream, Duplex);

// Utils to manage readable stream backpressure
function createReadStreamBackpressureManager(readableStream) {
	var manager = {
		waitPush: true,
		programmedPushs: [],
		programPush: function programPush(chunk, encoding, done) {
			done = done || function () {};
			// Store the current write
			manager.programmedPushs.push([chunk, encoding, done]);
			// Need to be async to avoid nested push attempts
			// Programm a push attempt
			setImmediate(manager.attemptPush);
			// Let's say we're ready for a read
			readableStream.emit('readable');
			readableStream.emit('drain');
		},
		attemptPush: function () {
			var nextPush;

			if (manager.waitPush) {
				if (manager.programmedPushs.length) {
					nextPush = manager.programmedPushs.shift();
					manager.waitPush = readableStream.push(nextPush[0], nextPush[1]);
					(nextPush[2])();
				}
			} else {
				setImmediate(function () {
					// Need to be async to avoid nested push attempts
					readableStream.emit('readable');
				});
			}
		}
	};

	// Patch the readable stream to manage reads
	readableStream._read = function streamFilterRestoreRead() {
		manager.waitPush = true;
		// Need to be async to avoid nested push attempts
		setImmediate(manager.attemptPush);
	};

	return manager;
}

module.exports = FirstChunkStream;
