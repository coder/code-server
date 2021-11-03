'use strict'

var openssl = require('../lib/openssl.js')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

// NOTE: we cover here only the test cases left in coverage report
describe('openssl.js tests', function () {
  describe('#.exec()', function () {
    it('search string not found', function (done) {
      openssl.exec([
        'dhparam',
        '-outform',
        'PEM',
        128
      ], 'DH PARAMETERS 404', function (error) {
        hlp.checkError(error, true)
        done()
      })
    })
  })

  describe('#.execBinary()', function () {
    it('no tmpfiles parameter', function (done) {
      openssl.execBinary([
        'dhparam',
        '-outform',
        'PEM',
        128
      ], function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.ok()
        done()
      })
    })
  })

  describe('#.spawn()', function () {
    it.skip('error case [openssl return code 2]', function (done) {
      // TODO; couldn't figure an example out
    })
    // TODO; I expect some more cases in here or code cleanup required
  })
})
