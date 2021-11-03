'use strict'

var pem = require('..')
var pemHelper = require('../lib/helper.js')
var fs = require('fs')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

describe('convert.js tests', function () {
  after(function (done) {
    var tmpfiles
    tmpfiles = [
      './test/fixtures/tmp.der',
      './test/fixtures/tmp.pem',
      './test/fixtures/tmp.p7b',
      './test/fixtures/tmp.pfx'
    ]
    pemHelper.deleteTempFiles(tmpfiles, function (fsErr) {
      hlp.checkError(fsErr)
      done()
    })
  })

  describe('trigger error case', function () {
    before(function () {
      pem.config({
        pathOpenSSL: 'zzzzzzzzzzz'
      })
    })
    it('#.PEM2DER()', function (done) {
      pem.convert.PEM2DER('./test/fixtures/nopkey.pem', './test/fixtures/tmp.der', function (error, result) {
        hlp.checkError(error, true)
        done()
      })
    })
    it('#.DER2PEM()', function (done) {
      pem.convert.DER2PEM('./test/fixtures/tmp.der', './test/fixtures/tmp.pem', function (error, result) {
        hlp.checkError(error, true)
        done()
      })
    })
    it('#.PEM2P7B()', function (done) {
      pem.convert.PEM2P7B({ cert: './test/fixtures/nopkey.pem' }, './test/fixtures/tmp.p7b', function (error, result) {
        hlp.checkError(error, true)
        done()
      })
    })
    it('#.P7B2PEM()', function (done) {
      pem.convert.P7B2PEM('./test/fixtures/tmp.p7b', './test/fixtures/tmp.pem', function (error, result) {
        hlp.checkError(error, true)
        done()
      })
    })
    it('#.PEM2PFX()', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/testnopw.key'
      }
      // password is required to encrypt the .pfx file; enforced by openssl
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error, true)
        done()
      })
    })
    it('#.PFX2PEM()', function (done) {
      pem.convert.PFX2PEM('./test/fixtures/tmp.pfx', './test/fixtures/tmp.pem', 'password', function (error, result) {
        hlp.checkError(error, true)
        done()
      })
    })
    it('#.P7B2PFX() [error in 1st step]', function (done) {
      pem.convert.P7B2PFX({ cert: './test/fixtures/test.p7b', key: './test/fixtures/test.key', ca: './test/fixtures/GeoTrust_Primary_CA.pem' }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error, true)
        done()
      })
    })
    it('#.P7B2PFX() [error in 2nd step]', function (done) {
      pem.config({
        pathOpenSSL: process.env.OPENSSL_BIN || 'openssl'
      })
      pem.convert.P7B2PFX({ cert: './test/fixtures/test.p7b', key: './test/fixtures/test404.key', ca: './test/fixtures/ca404.pem' }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error, true)
        done()
      })
    })
  })

  describe('check all success cases', function () {
    it('#.PEM2DER() [not providing type]', function (done) {
      pem.convert.PEM2DER('./test/fixtures/nopkey.pem', './test/fixtures/tmp.der', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.PEM2DER() [providing type]', function (done) {
      pem.convert.PEM2DER('./test/fixtures/nopkey.pem', './test/fixtures/tmp.der', 'x509', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.DER2PEM() [not providing type]', function (done) {
      pem.convert.DER2PEM('./test/fixtures/tmp.der', './test/fixtures/tmp.pem', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        var f1 = fs.readFileSync('./test/fixtures/nopkey.pem').toString()
        var f2 = fs.readFileSync('./test/fixtures/tmp.pem').toString()
        expect(f1).to.equal(f2)
        done()
      })
    })

    it('#.DER2PEM() [providing type]', function (done) {
      pem.convert.DER2PEM('./test/fixtures/tmp.der', './test/fixtures/tmp.pem', 'x509', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        var f1 = fs.readFileSync('./test/fixtures/nopkey.pem').toString()
        var f2 = fs.readFileSync('./test/fixtures/tmp.pem').toString()
        expect(f1).to.equal(f2)
        done()
      })
    })

    it('#.PEM2P7B() [providing a CA cert; no array format]', function (done) {
      pem.convert.PEM2P7B({ cert: './test/fixtures/nopkey.pem', ca: './test/fixtures/GeoTrust_Primary_CA.pem' }, './test/fixtures/tmp.p7b', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.PEM2P7B() [providing a CA cert; array format]', function (done) {
      pem.convert.PEM2P7B({ cert: './test/fixtures/nopkey.pem', ca: ['./test/fixtures/GeoTrust_Primary_CA.pem'] }, './test/fixtures/tmp.p7b', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.PEM2P7B() [not providing a CA cert]', function (done) {
      pem.convert.PEM2P7B({ cert: './test/fixtures/nopkey.pem' }, './test/fixtures/tmp.p7b', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.P7B2PEM()', function (done) {
      pem.convert.P7B2PEM('./test/fixtures/tmp.p7b', './test/fixtures/tmp.pem', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        var f1 = fs.readFileSync('./test/fixtures/nopkey.pem').toString()
        var f2 = fs.readFileSync('./test/fixtures/tmp.pem').toString()
        // can't directly compare as f2 comes with x509v3 header which might not be included in source file
        pem.readCertificateInfo(f1, function (error, d1) {
          hlp.checkError(error)
          pem.readCertificateInfo(f2, function (error, d2) {
            hlp.checkError(error)
            expect(d1).to.eql(d2)
          })
          done()
        })
      })
    })

    it('#.PEM2PFX() [no password protected key file]', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/testnopw.key'
      }
      // password is required to encrypt the .pfx file; enforced by openssl
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.PEM2PFX() [password protected key file]', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/test.key'
      }
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.PEM2PFX() [providing CA cert; no array format]', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/test.key',
        ca: './test/fixtures/GeoTrust_Primary_CA.pem'
      }
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.PEM2PFX() [providing CA cert; array format]', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/test.key',
        ca: ['./test/fixtures/GeoTrust_Primary_CA.pem']
      }
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.PFX2PEM()', function (done) {
      pem.convert.PFX2PEM('./test/fixtures/tmp.pfx', './test/fixtures/tmp.pem', 'password', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.P7B2PFX() [providing ca cert; no array format]', function (done) {
      pem.convert.P7B2PFX({ cert: './test/fixtures/test.p7b', key: './test/fixtures/test.key', ca: './test/fixtures/GeoTrust_Primary_CA.pem' }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.P7B2PFX() [providing ca cert; array format]', function (done) {
      pem.convert.P7B2PFX({ cert: './test/fixtures/test.p7b', key: './test/fixtures/test.key', ca: ['./test/fixtures/GeoTrust_Primary_CA.pem'] }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })

    it('#.P7B2PFX() [not providing ca cert]', function (done) {
      pem.convert.P7B2PFX({ cert: './test/fixtures/test.p7b', key: './test/fixtures/test.key' }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.true()
        done()
      })
    })
  })
})
