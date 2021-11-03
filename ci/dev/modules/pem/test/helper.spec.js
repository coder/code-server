'use strict'

var fs = require('fs')
var helper = require('../lib/helper.js')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
chai.use(dirtyChai)

// NOTE: we cover here only the test cases left in coverage report
describe('helper.js tests', function () {
  describe('#.createPasswordFile()', function () {
    it('invalid options [not sufficient object keys]', function (done) {
      var tmpfiles = []
      var bufferOrPath = fs.readFileSync('./test/fixtures/idsrv3test.pfx')
      helper.createPasswordFile(
        {},
        ['pkcs12', '-info', '-in', bufferOrPath, '-noout', '-maciter', '-nodes'],
        tmpfiles
      )
      helper.deleteTempFiles(tmpfiles, function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })
    it('invalid options [no password and passType option]', function (done) {
      var tmpfiles = []
      var bufferOrPath = fs.readFileSync('./test/fixtures/idsrv3test.pfx')
      helper.createPasswordFile(
        { cipher: '', bla: true, blub: true },
        ['pkcs12', '-info', '-in', bufferOrPath, '-noout', '-maciter', '-nodes'],
        tmpfiles
      )
      helper.deleteTempFiles(tmpfiles, function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })
    it('mustPass option', function (done) {
      var tmpfiles = []
      var bufferOrPath = fs.readFileSync('./test/fixtures/idsrv3test.pfx')
      helper.createPasswordFile(
        { cipher: '', password: 'gregegegeg', passType: 'in', mustPass: 'password' },
        ['pkcs12', '-info', '-in', bufferOrPath, '-noout', '-maciter', '-nodes'],
        tmpfiles
      )
      helper.deleteTempFiles(tmpfiles, function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })
  })

  describe('#.deleteTempFiles()', function () {
    it('files argument typeof string', function (done) {
      helper.deleteTempFiles('404.pem', function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })
    it('files argument invalid type', function (done) {
      helper.deleteTempFiles(true, function (fsErr) {
        hlp.checkError(fsErr, true)
        done()
      })
    })
    it('files argument array contains non-string value', function (done) {
      helper.deleteTempFiles([true], function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })
    it.skip('other error than ENOENT occured', function (done) {
      // TODO
    })
  })
})
