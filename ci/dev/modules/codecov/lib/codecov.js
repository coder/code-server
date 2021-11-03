var fs = require('fs')
var path = require('path')
var request = require('teeny-request').teenyRequest
var urlgrey = require('urlgrey')
var jsYaml = require('js-yaml')
var walk = require('ignore-walk')
var execFileSync = require('child_process').execFileSync
var execSync = require('child_process').execSync

var detectProvider = require('./detect')

var version = 'v' + require('../package.json').version

var patterns = ''
var more_patterns = ''
var winPatterns = ''

var isWindows =
  process.platform.match(/win32/) || process.platform.match(/win64/)

if (!isWindows) {
  patterns = (
    '-type f ( ' +
    '-name *coverage.* ' +
    '-or -name *.gcov ' +
    '-or -name *.lcov ' +
    '-or -name *.lst ' +
    '-or -name clover.xml ' +
    '-or -name cobertura.xml ' +
    '-or -name coverage-final.json ' +
    '-or -name gcov.info ' +
    '-or -name jacoco*.xml ' +
    '-or -name lcov.info ' +
    '-or -name luacov.report.out ' +
    '-or -name nosetests.xml ' +
    '-or -name report.xml ' +
    ') ' +
    '-not -name *.sh ' +
    '-not -name *.data ' +
    '-not -name *.py ' +
    '-not -name *.class ' +
    '-not -name *.xcconfig ' +
    '-not -name Coverage.profdata ' +
    '-not -name phpunit-code-coverage.xml ' +
    '-not -name coverage.serialized ' +
    '-not -name *.pyc ' +
    '-not -name *.cfg ' +
    '-not -name *.egg ' +
    '-not -name *.whl ' +
    '-not -name *.html ' +
    '-not -name *.js ' +
    '-not -name *.cpp ' +
    '-not -name coverage.jade ' +
    '-not -name include.lst ' +
    '-not -name inputFiles.lst ' +
    '-not -name createdFiles.lst ' +
    '-not -name coverage.html ' +
    '-not -name scoverage.measurements.* ' +
    '-not -name test_*_coverage.txt ' +
    '-not -path */vendor/* ' +
    '-not -path */htmlcov/* ' +
    '-not -path */home/cainus/* ' +
    '-not -path */virtualenv/* ' +
    '-not -path */js/generated/coverage/* ' +
    '-not -path */.virtualenv/* ' +
    '-not -path */virtualenvs/* ' +
    '-not -path */.virtualenvs/* ' +
    '-not -path */.env/* ' +
    '-not -path */.envs/* ' +
    '-not -path */env/* ' +
    '-not -path */envs/* ' +
    '-not -path */.venv/* ' +
    '-not -path */.venvs/* ' +
    '-not -path */venv/* ' +
    '-not -path */venvs/* ' +
    '-not -path */.git/* ' +
    '-not -path */.hg/* ' +
    '-not -path */.tox/* ' +
    '-not -path */__pycache__/* ' +
    '-not -path */.egg-info* ' +
    '-not -path */$bower_components/* ' +
    '-not -path */node_modules/* ' +
    '-not -path */conftest_*.c.gcov'
  ).split(' ')
} else {
  winPatterns = (
    '/a:-d /b /s *coverage.* ' +
    '/s nosetests.xml ' +
    '/s jacoco*.xml ' +
    '/s clover.xml ' +
    '/s report.xml ' +
    '/s cobertura.xml ' +
    '/s luacov.report.out ' +
    '/s lcov.info ' +
    '/s *.lcov ' +
    '/s gcov.info ' +
    '/s *.gcov ' +
    '/s *.lst' +
    '| findstr /i /v \\.sh$ ' +
    '| findstr /i /v \\.data$ ' +
    '| findstr /i /v \\.py$ ' +
    '| findstr /i /v \\.class$ ' +
    '| findstr /i /v \\.xcconfig$ ' +
    '| findstr /i /v Coverage\\.profdata$ ' +
    '| findstr /i /v phpunit-code-coverage\\.xml$ ' +
    '| findstr /i /v coverage\\.serialized$ ' +
    '| findstr /i /v \\.pyc$ ' +
    '| findstr /i /v \\.cfg$ ' +
    '| findstr /i /v \\.egg$ ' +
    '| findstr /i /v \\.whl$ ' +
    '| findstr /i /v \\.html$ ' +
    '| findstr /i /v \\.js$ ' +
    '| findstr /i /v \\.cpp$ ' +
    '| findstr /i /v coverage\\.jade$ ' +
    '| findstr /i /v include\\.lst$ ' +
    '| findstr /i /v inputFiles\\.lst$ ' +
    '| findstr /i /v createdFiles\\.lst$ ' +
    '| findstr /i /v coverage\\.html$ ' +
    '| findstr /i /v scoverage\\.measurements\\..* ' +
    '| findstr /i /v test_.*_coverage\\.txt ' +
    '| findstr /i /v \\vendor\\ ' +
    '| findstr /i /v \\htmlcov\\ ' +
    '| findstr /i /v \\home\\cainus\\ ' +
    '| findstr /i /v \\js\\generated\\coverage\\ ' +
    '| findstr /i /v \\virtualenv\\ ' +
    '| findstr /i /v \\virtualenvs\\ ' +
    '| findstr /i /v \\\\.virtualenv\\ ' +
    '| findstr /i /v \\\\.virtualenvs\\ ' +
    '| findstr /i /v \\\\.env\\ ' +
    '| findstr /i /v \\\\.envs\\ ' +
    '| findstr /i /v \\env\\ ' +
    '| findstr /i /v \\envs\\ ' +
    '| findstr /i /v \\\\.venv\\ ' +
    '| findstr /i /v \\\\.venvs\\ ' +
    '| findstr /i /v \\venv\\ ' +
    '| findstr /i /v \\venvs\\ ' +
    '| findstr /i /v \\\\.git\\ ' +
    '| findstr /i /v \\\\.hg\\ ' +
    '| findstr /i /v \\\\.tox\\ ' +
    '| findstr /i /v \\__pycache__\\ ' +
    '| findstr /i /v \\\\.egg-info* ' +
    '| findstr /i /v \\\\$bower_components\\ ' +
    '| findstr /i /v \\node_modules\\ ' +
    '| findstr /i /v \\conftest_.*\\.c\\.gcov '
  ).split(' ')
}

var sendToCodecovV2 = function (
  codecov_endpoint,
  query,
  upload_body,
  on_success,
  on_failure
) {
  // Direct to Codecov
  request(
    {
      uri: urlgrey(codecov_endpoint + '/upload/v2')
        .query(query)
        .toString(),
      method: 'POST',
      body: upload_body,
      headers: {
        'Content-Type': 'text/plain',
        Accept: 'text/plain',
      },
    },
    function (err, response) {
      if (err || response.statusCode !== 200) {
        console.log('    ' + (err || response.body))
        return response
          ? on_failure(response.statusCode, response.body)
          : on_failure(err.code, err.message)
      } else {
        console.log('    Success!')
        console.log('    View report at: ' + response.body)
        return on_success(response.body)
      }
    }
  )
}

var sendToCodecovV4 = function (
  codecov_endpoint,
  query,
  upload_body,
  on_success,
  on_failure
) {
  // Direct to S3
  request(
    {
      uri: urlgrey(codecov_endpoint + '/upload/v4')
        .query(query)
        .toString(),
      method: 'POST',
      body: '',
      headers: {
        'Content-Type': 'text/plain',
        Accept: 'text/plain',
      },
    },
    function (err, response, result) {
      if (err) {
        sendToCodecovV2(
          codecov_endpoint,
          query,
          upload_body,
          on_success,
          on_failure
        )
      } else if (result.split('\n').length !== 2) {
        console.log('    Could not upload to Codecov: ' + result)
      } else {
        var codecov_report_url = result.split('\n')[0]
        request(
          {
            uri: result.split('\n')[1],
            method: 'PUT',
            body: upload_body,
            headers: {
              'Content-Type': 'text/plain',
            },
          },
          function (err) {
            if (err) {
              sendToCodecovV2(
                codecov_endpoint,
                query,
                upload_body,
                on_success,
                on_failure
              )
            } else {
              console.log('    Success!')
              console.log('    View report at: ' + codecov_report_url)
              on_success(codecov_report_url)
            }
          }
        )
      }
    }
  )
}

var upload = function (args, on_success, on_failure) {
  // Build query
  var codecov_endpoint =
    args.options.url ||
    process.env.codecov_url ||
    process.env.CODECOV_URL ||
    'https://codecov.io'
  var query = {}
  var debug = []
  var yamlFile =
    args.options.yml ||
    process.env.codecov_yml ||
    process.env.CODECOV_YML ||
    'codecov.yml'

  console.log(
    '' +
      '  _____          _  \n' +
      ' / ____|        | |  \n' +
      '| |     ___   __| | ___  ___ _____   __  \n' +
      '| |    / _ \\ / _` |/ _ \\/ __/ _ \\ \\ / /  \n' +
      '| |___| (_) | (_| |  __/ (_| (_) \\ V /  \n' +
      ' \\_____\\___/ \\__,_|\\___|\\___\\___/ \\_/  \n' +
      '                                ' +
      version
  )

  if ((args.options.disable || '').split(',').indexOf('detect') === -1) {
    console.log('==> Detecting CI Provider')
    query = detectProvider()
  } else {
    debug.push('disabled detect')
  }

  query.yaml = [yamlFile, '.codecov.yml'].reduce(function (result, file) {
    return (
      result ||
      (fs.existsSync(path.resolve(process.cwd(), file))
        ? path.resolve(process.cwd(), file)
        : undefined)
    )
  }, undefined)

  if (args.options.build) {
    query.build = args.options.build
  }

  if (args.options.commit) {
    query.commit = args.options.commit
  }

  if (args.options.branch) {
    query.branch = args.options.branch
  }

  if (args.options.slug) {
    query.slug = args.options.slug
  }

  var flags =
    args.options.flags || process.env.codecov_flags || process.env.CODECOV_FLAGS
  if (flags) {
    query.flags = flags
  }

  var yamlToken
  try {
    var loadedYamlFile = jsYaml.safeLoad(fs.readFileSync(query.yaml, 'utf8'))
    yamlToken =
      loadedYamlFile && loadedYamlFile.codecov && loadedYamlFile.codecov.token
  } catch (e) {
    // silently fail
  }
  var token =
    args.options.token ||
    yamlToken ||
    process.env.codecov_token ||
    process.env.CODECOV_TOKEN
  if (token) {
    query.token = token
  }

  query.package = 'node-' + version

  console.log('==> Configuration: ')
  console.log('    Endpoint: ' + codecov_endpoint)
  // Don't output `query` directly as it contains the upload token
  console.log({
    commit: query.commit,
    branch: query.branch,
    package: query.package,
  })

  var upload = ''

  // Add specified env vars
  var env_found = false
  if (args.options.env || process.env.CODECOV_ENV || process.env.codecov_env) {
    var env = (
      args.options.env +
      ',' +
      (process.env.CODECOV_ENV || '') +
      ',' +
      (process.env.codecov_env || '')
    ).split(',')
    for (var i = env.length - 1; i >= 0; i--) {
      if (env[i]) {
        upload += env[i] + '=' + (process.env[env[i]] || '').toString() + '\n'
        env_found = true
      }
    }
    if (env_found) {
      upload += '<<<<<< ENV\n'
    }
  }

  // List git files
  var root = path.resolve(args.options.root || query.root || '.')
  console.log('==> Building file structure')
  try {
    var network = execFileSync('git', ['ls-files'], { cwd: root })
    if (network === '') {
      network = execFileSync('hg', ['locate'], { cwd: root })
    }
    upload += network.toString().trim() + '\n<<<<<< network\n'
  } catch (err) {
    // not a git/hg dir, emulating git/hg ignore behavior
    upload +=
      walk
        .sync({ path: root, ignoreFiles: ['.gitignore', '.hgignore'] })
        .join('\n')
        .trim() + '\n<<<<<< network\n'
  }
  // Make gcov reports
  if ((args.options.disable || '').split(',').indexOf('gcov') === -1) {
    try {
      console.log('==> Generating gcov reports (skip via --disable=gcov)')
      var gcg = args.options['gcov-glob'] || ''
      if (gcg) {
        if (!isWindows) {
          gcg = gcg
            .split(' ')
            .map(function (p) {
              return "-not -path '" + p + "'"
            })
            .join(' ')
        } else {
          gcg = gcg
            .split(' ')
            .map(function (p) {
              return '^| findstr /i /v ' + p
            })
            .join(' ')
        }
      }
      var gcov
      if (!isWindows) {
        gcov =
          'find ' +
          (sanitizeVar(args.options['gcov-root']) || root) +
          " -type f -name '*.gcno' " +
          gcg +
          ' -exec ' +
          (sanitizeVar(args.options['gcov-exec']) || 'gcov') +
          ' ' +
          (sanitizeVar(args.options['gcov-args']) || '') +
          ' {} +'
      } else {
        // @TODO support for root
        // not straight forward due to nature of windows command dir
        gcov =
          'for /f "delims=" %g in (\'dir /a-d /b /s *.gcno ' +
          gcg +
          "') do " +
          (sanitizeVar(args.options['gcov-exec']) || 'gcov') +
          ' ' +
          (sanitizeVar(args.options['gcov-args']) || '') +
          ' %g'
      }
      debug.push(gcov)
      console.log('    $ ' + gcov)
      execFileSync(gcov)
    } catch (e) {
      console.log('    Failed to run gcov command.')
    }
  } else {
    debug.push('disabled gcov')
  }

  // Detect .bowerrc
  var bowerrc
  if (!isWindows) {
    bowerrc = execSync('test -f .bowerrc && cat .bowerrc || echo ""', {
      cwd: root,
    })
      .toString()
      .trim()
  } else {
    bowerrc = fs.existsSync('.bowerrc')
  }
  if (bowerrc) {
    bowerrc = JSON.parse(bowerrc).directory
    if (bowerrc) {
      if (!isWindows) {
        more_patterns = (
          " -not -path '*/" +
          bowerrc.toString().replace(/\/$/, '') +
          "/*'"
        ).split(' ')
      } else {
        more_patterns = (
          '| findstr /i /v \\' +
          bowerrc.toString().replace(/\/$/, '') +
          '\\'
        ).split(' ')
      }
    }
  }

  var files = [],
    file = null
  if (args.options.pipe) {
    // Append piped reports
    upload += '# path=piped\n' + args.options.pipe.join('') + '\n<<<<<< EOF\n'
    console.log('==> Reading report from stdin')
  } else if (args.options.file) {
    // Append manually entered reports
    file = args.options.file
    console.log('==> Targeting specific file')
    try {
      upload +=
        '# path=' +
        file +
        '\n' +
        fs.readFileSync(file, 'utf8').toString() +
        '\n<<<<<< EOF\n'
      console.log('    + ' + file)
      files.push(file)
    } catch (e) {
      debug.push('failed: ' + file.split('/').pop())
      console.log('    X Failed to read file at ' + file)
    }
  } else if ((args.options.disable || '').split(',').indexOf('search') === -1) {
    console.log('==> Scanning for reports')
    var _files
    var _findArgs
    if (!isWindows) {
      // @TODO support for a root directory
      // It's not straightforward due to the nature of the find command
      _findArgs = [root].concat(patterns)
      if (more_patterns) {
        _findArgs.concat(more_patterns)
      }
      _files = execFileSync('find', _findArgs).toString().trim().split('\n')
    } else {
      // @TODO support for a root directory
      // It's not straightforward due to the nature of the dir command
      _findArgs = [root].concat(winPatterns)
      if (more_patterns) {
        _findArgs.concat(more_patterns)
      }
      _files = execSync('dir ' + winPatterns.join(' ') + more_patterns)
        .toString()
        .trim()
        .split('\r\n')
    }
    if (_files) {
      for (var i2 = _files.length - 1; i2 >= 0; i2--) {
        file = _files[i2]
        try {
          upload +=
            '# path=' +
            file +
            '\n' +
            fs.readFileSync(file, 'utf8').toString() +
            '\n<<<<<< EOF\n'
          console.log('    + ' + file)
          files.push(file)
        } catch (e) {
          debug.push('failed: ' + file.split('/').pop())
          console.log('    X Failed to read file at ' + file)
        }
      }
    }
  } else {
    debug.push('disabled search')
  }

  if (files) {
    // Upload to Codecov
    if (args.options.dump) {
      console.log('-------- DEBUG START --------')
      console.log(upload)
      console.log('-------- DEBUG END --------')
    } else {
      console.log('==> Uploading reports')
      var _upload
      if ((args.options.disable || '').split(',').indexOf('s3') === -1) {
        _upload = sendToCodecovV4
      } else {
        _upload = sendToCodecovV2
      }
      _upload(
        codecov_endpoint,
        query,
        upload,
        function () {
          // remove files after Uploading
          if (args.options.clear) {
            for (var i = files.length - 1; i >= 0; i--) {
              try {
                fs.unlinkSync(files[i])
              } catch (e) {}
            }
          }
          if (on_success) {
            on_success.apply(this, arguments)
          }
        },
        on_failure || function () {}
      )
    }
  }

  return {
    body: upload,
    files: files,
    query: query,
    debug: debug,
    url: codecov_endpoint,
  }
}

function sanitizeVar(arg) {
  if (!arg) {
    return ''
  }
  return arg.replace(/&/g, '')
}

module.exports = {
  sanitizeVar: sanitizeVar,
  upload: upload,
  version: version,
  sendToCodecovV2: sendToCodecovV2,
  sendToCodecovV4: sendToCodecovV4,
}
