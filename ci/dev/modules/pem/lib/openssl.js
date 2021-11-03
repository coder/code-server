var helper = require('./helper.js')
var cpspawn = require('child_process').spawn
var pathlib = require('path')
var fs = require('fs')
var osTmpdir = require('os-tmpdir')
var crypto = require('crypto')
var which = require('which')
var settings = {}
var tempDir = process.env.PEMJS_TMPDIR || osTmpdir()

/**
 * pem openssl module
 *
 * @module openssl
 */

/**
 * configue this openssl module
 *
 * @static
 * @param {String} option name e.g. pathOpenSSL, openSslVersion; TODO rethink nomenclature
 * @param {*} value value
 */
function set (option, value) {
  settings[option] = value
}

/**
 * get configuration setting value
 *
 * @static
 * @param {String} option name
 */
function get (option) {
  return settings[option] || null
}

/**
 * Spawn an openssl command
 *
 * @static
 * @param {Array} params Array of openssl command line parameters
 * @param {String} searchStr String to use to find data
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout-substring)
 */
function exec (params, searchStr, tmpfiles, callback) {
  if (!callback && typeof tmpfiles === 'function') {
    callback = tmpfiles
    tmpfiles = false
  }

  spawnWrapper(params, tmpfiles, function (err, code, stdout, stderr) {
    var start, end

    if (err) {
      return callback(err)
    }

    if ((start = stdout.match(new RegExp('\\-+BEGIN ' + searchStr + '\\-+$', 'm')))) {
      start = start.index
    } else {
      start = -1
    }

    // To get the full EC key with parameters and private key
    if (searchStr === 'EC PARAMETERS') {
      searchStr = 'EC PRIVATE KEY'
    }

    if ((end = stdout.match(new RegExp('^\\-+END ' + searchStr + '\\-+', 'm')))) {
      end = end.index + end[0].length
    } else {
      end = -1
    }

    if (start >= 0 && end >= 0) {
      return callback(null, stdout.substring(start, end))
    } else {
      return callback(new Error(searchStr + ' not found from openssl output:\n---stdout---\n' + stdout + '\n---stderr---\n' + stderr + '\ncode: ' + code))
    }
  })
}

/**
 *  Spawn an openssl command and get binary output
 *
 * @static
 * @param {Array} params Array of openssl command line parameters
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout)
*/
function execBinary (params, tmpfiles, callback) {
  if (!callback && typeof tmpfiles === 'function') {
    callback = tmpfiles
    tmpfiles = false
  }
  spawnWrapper(params, tmpfiles, true, function (err, code, stdout, stderr) {
    if (err) {
      return callback(err)
    }
    return callback(null, stdout)
  })
}

/**
 * Generically spawn openSSL, without processing the result
 *
 * @static
 * @param {Array}        params   The parameters to pass to openssl
 * @param {Boolean}      binary   Output of openssl is binary or text
 * @param {Function}     callback Called with (error, exitCode, stdout, stderr)
 */
function spawn (params, binary, callback) {
  var pathBin = get('pathOpenSSL') || process.env.OPENSSL_BIN || 'openssl'

  testOpenSSLPath(pathBin, function (err) {
    if (err) {
      return callback(err)
    }
    var openssl = cpspawn(pathBin, params)
    var stderr = ''

    var stdout = (binary ? Buffer.alloc(0) : '')
    openssl.stdout.on('data', function (data) {
      if (!binary) {
        stdout += data.toString('binary')
      } else {
        stdout = Buffer.concat([stdout, data])
      }
    })

    openssl.stderr.on('data', function (data) {
      stderr += data.toString('binary')
    })
    // We need both the return code and access to all of stdout.  Stdout isn't
    // *really* available until the close event fires; the timing nuance was
    // making this fail periodically.
    var needed = 2 // wait for both exit and close.
    var code = -1
    var finished = false
    var done = function (err) {
      if (finished) {
        return
      }

      if (err) {
        finished = true
        return callback(err)
      }

      if (--needed < 1) {
        finished = true
        if (code) {
          if (code === 2 && (stderr === '' || /depth lookup: unable to/.test(stderr))) {
            return callback(null, code, stdout, stderr)
          }
          return callback(new Error('Invalid openssl exit code: ' + code + '\n% openssl ' + params.join(' ') + '\n' + stderr), code)
        } else {
          return callback(null, code, stdout, stderr)
        }
      }
    }

    openssl.on('error', done)

    openssl.on('exit', function (ret) {
      code = ret
      done()
    })

    openssl.on('close', function () {
      stdout = (binary ? stdout : Buffer.from(stdout, 'binary').toString('utf-8'))
      stderr = Buffer.from(stderr, 'binary').toString('utf-8')
      done()
    })
  })
}

/**
 * Wrapper for spawn method
 *
 * @static
 * @param {Array} params The parameters to pass to openssl
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Boolean} [binary] Output of openssl is binary or text
 * @param {Function} callback Called with (error, exitCode, stdout, stderr)
 */
function spawnWrapper (params, tmpfiles, binary, callback) {
  if (!callback && typeof binary === 'function') {
    callback = binary
    binary = false
  }

  var files = []
  var delTempPWFiles = []

  if (tmpfiles) {
    tmpfiles = [].concat(tmpfiles)
    var fpath, i
    for (i = 0; i < params.length; i++) {
      if (params[i] === '--TMPFILE--') {
        fpath = pathlib.join(tempDir, crypto.randomBytes(20).toString('hex'))
        files.push({
          path: fpath,
          contents: tmpfiles.shift()
        })
        params[i] = fpath
        delTempPWFiles.push(fpath)
      }
    }
  }

  var file
  for (i = 0; i < files.length; i++) {
    file = files[i]
    fs.writeFileSync(file.path, file.contents)
  }

  spawn(params, binary, function (err, code, stdout, stderr) {
    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      callback(err || fsErr, code, stdout, stderr)
    })
  })
}

/**
 * Validates the pathBin for the openssl command
 *
 * @private
 * @param {String} pathBin The path to OpenSSL Bin
 * @param {Function} callback Callback function with an error object
 */
function testOpenSSLPath (pathBin, callback) {
  which(pathBin, function (error) {
    if (error) {
      return callback(new Error('Could not find openssl on your system on this path: ' + pathBin))
    }
    callback()
  })
}

/* Once PEM is imported, the openSslVersion is set with this function. */
spawn(['version'], false, function (err, code, stdout, stderr) {
  var text = String(stdout) + '\n' + String(stderr) + '\n' + String(err)
  var tmp = text.match(/^LibreSSL/i)
  set('openSslVersion', (tmp && tmp[0] ? 'LibreSSL' : 'openssl').toUpperCase())
})

module.exports = {
  exec: exec,
  execBinary: execBinary,
  spawn: spawn,
  spawnWrapper: spawnWrapper,
  set: set,
  get: get
}
