const { Transform } = require('stream');

/**
 * The ReadlineTransform is reading String or Buffer content from a Readable stream
 * and writing each line which ends without line break as object
 *
 * @param {RegExp} opts.breakMatcher - line break matcher for str.split() (default: /\r?\n/)
 * @param {Boolean} opts.ignoreEndOfBreak - if content ends with line break, ignore last empty line (default: true)
 * @param {Boolean} opts.skipEmpty - if line is empty string, skip it (default: false)
 */
class ReadlineTransform extends Transform {
  constructor(options) {
    const opts = options || {};
    opts.objectMode = true;
    super(opts);
    this._brRe = opts.breakMatcher || /\r?\n/;
    this._ignoreEndOfBreak = 'ignoreEndOfBreak' in opts ? Boolean(opts.ignoreEndOfBreak) : true;
    this._skipEmpty = Boolean(opts.skipEmpty);
    this._buf = null;
  }

  _transform(chunk, encoding, cb) {
    let str;
    if (Buffer.isBuffer(chunk) || encoding === 'buffer') {
      str = chunk.toString('utf8');
    } else {
      str = chunk;
    }

    try {
      if (this._buf !== null) {
        this._buf += str;  
      } else {
        this._buf = str;  
      }

      const lines = this._buf.split(this._brRe);
      const lastIndex = lines.length - 1;
      for (let i = 0; i < lastIndex; i++) {
        this._writeItem(lines[i]);
      }

      const lastLine = lines[lastIndex];
      if (lastLine.length) {
        this._buf = lastLine;
      } else if (!this._ignoreEndOfBreak) {
        this._buf = '';
      } else {
        this._buf = null;
      }
      cb();
    } catch(err) {
      cb(err); // invalid data type;
    }
  }

  _flush(cb) {
    if (this._buf !== null) {
      this._writeItem(this._buf);
      this._buf = null;
    }
    cb();
  }

  _writeItem(line) {
    if (line.length > 0 || !this._skipEmpty) {
      this.push(line);
    }
  }
}

module.exports = exports.default = ReadlineTransform;
