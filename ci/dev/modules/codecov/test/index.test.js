var fs = require('fs')
var mockFs = require('mock-fs')
var codecov = require('../lib/codecov')

var isWindows =
  process.platform.match(/win32/) || process.platform.match(/win64/)
var pathSeparator = !isWindows ? '/' : '\\'

describe('Codecov', function() {
  beforeEach(function() {
    try {
      fs.unlinkSync('.bowerrc')
    } catch (e) {}
  })

  afterAll(function() {
    try {
      fs.unlinkSync('.bowerrc')
    } catch (e) {}
  })

  it('can get a token passed via env variable', function() {
    jest.setTimeout(10000)
    process.env.codecov_token = 'abc123'
    expect(codecov.upload({ options: { dump: true } }).query.token).toBe(
      'abc123'
    )
    delete process.env.codecov_token
    process.env.CODECOV_TOKEN = 'ABC123'
    expect(codecov.upload({ options: { dump: true } }).query.token).toBe(
      'ABC123'
    )
    delete process.env.CODECOV_TOKEN
  })

  it('can get a token passed in cli', function() {
    expect(
      codecov.upload({ options: { dump: true, token: 'qwerty' } }).query.token
    ).toBe('qwerty')
  })

  it('can read a codecov.yml file', function() {
    mockFs({
      'codecov.yml': 'codecov:\n  token: fake-token',
    })
    expect(codecov.upload({ options: { dump: true } }).query.token).toBe(
      'fake-token'
    )
    mockFs.restore()
  })
  it('can read a .codecov.yml file', function() {
    mockFs({
      '.codecov.yml': 'codecov:\n  token: fake-token-dotfile',
    })
    expect(codecov.upload({ options: { dump: true } }).query.token).toBe(
      'fake-token-dotfile'
    )
    mockFs.restore()
  })
  it('should have no token if yaml file does not supplied', function() {
    mockFs({
      '.codecov.yml': 'codecov:\n  noconfig: true',
    })
    expect(codecov.upload({ options: { dump: true } }).query.token).toBe(
      undefined
    )
    mockFs.restore()
  })

  it('token precedence should be respected', function() {
    // options.token || .codecov.yml/codecov.yml file || codecov_token || CODECOV_TOKEN
    mockFs({
      '.codecov.yml': 'codecov:\n  token: fake-token-dotfile',
    })
    var upload = codecov.upload({ options: { dump: true, token: 'qwerty' } })
    expect(upload.query.token).toBe('qwerty')
    mockFs.restore()

    process.env.codecov_token = 'abc123'
    upload = codecov.upload({ options: { dump: true, token: 'qwerty2' } })
    expect(upload.query.token).toBe('qwerty2')
    delete process.env.codecov_token

    process.env.CODECOV_TOKEN = 'ABC123'
    upload = codecov.upload({ options: { dump: true, token: 'qwerty3' } })
    expect(upload.query.token).toBe('qwerty3')
    delete process.env.CODECOV_TOKEN

    mockFs({
      '.codecov.yml': 'codecov:\n  token: fake-token-dotfile',
    })
    process.env.codecov_token = 'abc123'
    upload = codecov.upload({ options: { dump: true } })
    expect(upload.query.token).toBe('fake-token-dotfile')
    mockFs.restore()

    process.env.codecov_token = 'abc123'
    process.env.CODECOV_TOKEN = 'ABC123'
    upload = codecov.upload({ options: { dump: true } })
    if (process.platform === 'win32') {
      expect(upload.query.token).toBe('ABC123')
    } else {
      expect(upload.query.token).toBe('abc123')
    }
    delete process.env.codecov_token
    delete process.env.CODECOV_TOKEN
  })

  // it('can auto detect reports', function() {
  //   var res = codecov.upload({ options: { dump: true } })
  //   expect(res.files[0].split(pathSeparator).pop()).toBe('example.coverage.txt')
  //   expect(res.body).toContain('this file is intentionally left blank')
  // })

  it('can specify report in cli', function() {
    var res = codecov.upload({
      options: {
        dump: true,
        file: 'test' + pathSeparator + 'example.coverage.txt',
      },
    })
    expect(res.files[0].split(pathSeparator).pop()).toBe('example.coverage.txt')
    expect(res.body).toContain('this file is intentionally left blank')
  })

  it('can specify report in cli fail', function() {
    var res = codecov.upload({ options: { dump: true, file: 'notreal.txt' } })
    expect(res.debug).toContain('failed: notreal.txt')
  })

  it('can disable search', function() {
    var res = codecov.upload({ options: { dump: true, disable: 'search' } })
    expect(res.debug).toContain('disabled search')
    expect(res.files).toEqual([])
  })

  it('can disable gcov', function() {
    var res = codecov.upload({ options: { dump: true, disable: 'gcov' } })
    console.log(res.debug)
    expect(res.debug).toContain('disabled gcov')
  })

  it('can disable detection', function() {
    var res = codecov.upload({ options: { dump: true, disable: 'detect' } })
    expect(res.debug).toContain('disabled detect')
  })

  it('can get build from cli args', function() {
    var res = codecov.upload({ options: { dump: true, build: 'value' } })
    expect(res.query.build).toBe('value')
  })

  it('can get commit from cli args', function() {
    var res = codecov.upload({ options: { dump: true, commit: 'value' } })
    expect(res.query.commit).toBe('value')
  })

  it('can get branch from cli args', function() {
    var res = codecov.upload({ options: { dump: true, branch: 'value' } })
    expect(res.query.branch).toBe('value')
  })

  it('can get slug from cli args', function() {
    var res = codecov.upload({ options: { dump: true, slug: 'value' } })
    expect(res.query.slug).toBe('value')
  })

  it('can get flags from cli args', function() {
    var res = codecov.upload({ options: { dump: true, flags: 'value' } })
    expect(res.query.flags).toBe('value')
  })

  it('can include env in cli', function() {
    process.env.HELLO = 'world'
    var res = codecov.upload({ options: { dump: true, env: 'HELLO,VAR1' } })
    expect(res.body).toContain('HELLO=world\n')
    expect(res.body).toContain('VAR1=\n')
    delete process.env.HELLO
  })

  it('can include env in env', function() {
    process.env.HELLO = 'world'
    process.env.CODECOV_ENV = 'HELLO,VAR1'
    var res = codecov.upload({ options: { dump: true, env: 'VAR2' } })
    expect(res.body).toContain('HELLO=world\n')
    expect(res.body).toContain('VAR1=\n')
    expect(res.body).toContain('VAR2=\n')
    delete process.env.HELLO
    delete process.env.CODECOV_ENV
  })

  it('can have custom args for gcov', function() {
    var res = codecov.upload({
      options: {
        dump: true,
        'gcov-root': 'folder/path',
        'gcov-glob': 'ignore/this/folder',
        'gcov-exec': 'llvm-gcov',
        'gcov-args': '-o',
      },
    })
    if (!isWindows) {
      expect(res.debug).toContain(
        "find folder/path -type f -name '*.gcno' -not -path 'ignore/this/folder' -exec llvm-gcov -o {} +"
      )
    } else {
      expect(res.debug).toContain(
        'for /f "delims=" %g in (\'dir /a-d /b /s *.gcno ^| findstr /i /v ignore/this/folder\') do llvm-gcov -o %g'
      )
    }
  })

  it('can read piped reports', function(done) {
    var exec = require('child_process').exec
    var childProcess = exec(
      'cat test/example.coverage.txt | bin/codecov -l --dump --disable=gcov',
      function(err, stdout) {
        try {
          expect(stdout.toString()).toContain('path=piped')
          expect(stdout.toString()).toContain(
            'this file is intentionally left blank'
          )
        } catch (e) {
          var isWin = process.platform === 'win32' || 'win64'
          expect(isWin)
        }
        childProcess.kill()
        done()
      }
    )
  })

  it('should have the correct version number', function() {
    var version = require('../package.json').version
    expect(codecov.version).toBe('v' + version)
  })

  it('Should use codecov.yml via env variable', function() {
    var CWD = process
      .cwd()
      .toString()
      .replace(/\\/g, '/')
    expect(
      codecov
        .upload({ options: { dump: true, disable: 'detect' } })
        .query.yaml.toString()
        .replace(/\\/g, '/')
    ).toBe(CWD + '/codecov.yml')

    mockFs({
      'foo.yml': '',
    })
    process.env.codecov_yml = 'foo.yml'
    expect(
      codecov
        .upload({ options: { dump: true, disable: 'detect' } })
        .query.yaml.toString()
        .replace(/\\/g, '/')
    ).toBe(CWD + '/foo.yml')
    mockFs.restore()
    delete process.env.codecov_yml

    mockFs({
      'FOO.yml': '',
    })
    process.env.CODECOV_YML = 'FOO.yml'
    expect(
      codecov
        .upload({ options: { dump: true, disable: 'detect' } })
        .query.yaml.toString()
        .replace(/\\/g, '/')
    ).toBe(CWD + '/FOO.yml')
    mockFs.restore()
    delete process.env.CODECOV_YML
  })

  it('can get config from cli args', function() {
    mockFs({
      'foo.yml': '',
    })
    var res = codecov.upload({
      options: { dump: true, yml: 'foo.yml', disable: 'detect' },
    })
    var CWD = process
      .cwd()
      .toString()
      .replace(/\\/g, '/')
    expect(res.query.yaml.toString().replace(/\\/g, '/')).toBe(CWD + '/foo.yml')
    mockFs.restore()
  })

  it('can sanitize inputs', function() {
    expect(codecov.sanitizeVar('real & run unsafe & command')).toEqual(
      'real  run unsafe  command'
    )
  })

  it('gracefully sanitizes undefined', function() {
    expect(function() {
      codecov.sanitizeVar(undefined)
    }).not.toThrow()
  })
})
