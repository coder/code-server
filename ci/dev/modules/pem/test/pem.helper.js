'use strict'

var fs = require('fs')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

process.env.PEMJS_TMPDIR = './tmp'

if (process.env.TRAVIS === 'true' && process.env.OPENSSL_DIR !== '') {
  process.env.OPENSSL_BIN = '/openssl/bin/openssl'
}

function checkTmpEmpty () {
  expect(fs.readdirSync(process.env.PEMJS_TMPDIR)).to.be.empty()
}

function checkError (error, expectError) {
  if (expectError) {
    expect(error).to.be.ok()
    if (expectError !== true) { // object
      Object.keys(expectError).forEach(function (k) {
        expect(error[k]).to.equal(expectError[k]) // code, message, ...
      })
    }
  } else { expect(error).to.not.be.ok() }
}

function checkEcparam (data, min, max) {
  expect(data).to.be.an('object').that.has.property('ecparam')
  expect(data.ecparam).to.be.a('string')
  expect(/^\r?\n*-----BEGIN EC PARAMETERS-----\r?\n/.test(data.ecparam)).to.be.true()
  expect(/\r?\n-----END EC PARAMETERS-----\r?\n/.test(data.ecparam)).to.be.true()
  expect(/\r?\n-----BEGIN EC PRIVATE KEY-----\r?\n/.test(data.ecparam)).to.be.true()
  expect(/\r?\n-----END EC PRIVATE KEY-----\r?\n*$/.test(data.ecparam)).to.be.true()
  var matchup = /-----BEGIN EC PRIVATE KEY-----[\s\S]+-----END EC PRIVATE KEY-----/.exec(data.ecparam)
  expect(matchup[0].trim().length).to.be.within(min + 1, max - 1)
}

function checkEcparamNoOut (data, min, max) {
  expect(data).to.be.an('object').that.has.property('ecparam')
  expect(data.ecparam).to.be.a('string')
  expect(/^\r?\n*-----BEGIN EC PRIVATE KEY-----\r?\n/.test(data.ecparam)).to.be.true()
  expect(/\r?\n-----END EC PRIVATE KEY-----\r?\n*$/.test(data.ecparam)).to.be.true()
  var matchup = /-----BEGIN EC PRIVATE KEY-----[\s\S]+-----END EC PRIVATE KEY-----/.exec(data.ecparam)
  expect(matchup[0].trim().length).to.be.within(min + 1, max - 1)
}

function checkDhparam (data, min, max) {
  expect(data).to.be.an('object').that.has.property('dhparam')
  expect(data.dhparam).to.be.a('string')
  expect(/^\r?\n*-----BEGIN DH PARAMETERS-----\r?\n/.test(data.dhparam)).to.be.true()
  expect(/\r?\n-----END DH PARAMETERS-----\r?\n*$/.test(data.dhparam)).to.be.true()
  expect(data.dhparam.trim().length).to.be.within(min + 1, max - 1)
}

function checkPrivateKey (data, min, max, encrypted) {
  expect(data).to.be.an('object').that.has.property('key')
  expect(data.key).to.be.a('string')
  if (encrypted) { expect(/ENCRYPTED\r?\n/.test(data.key)).to.be.true() }
  expect(/^\r?\n*-----BEGIN RSA PRIVATE KEY-----\r?\n/.test(data.key)).to.be.true()
  expect(/\r?\n-----END RSA PRIVATE KEY-----\r?\n*$/.test(data.key)).to.be.true()
  expect(data.key.trim().length).to.be.within(min + 1, max - 1)
}

function checkCSR (data, expectClientKey) {
  expect(data).to.be.an('object');
  ['clientKey', 'csr'].forEach(function (k) {
    expect(data).to.have.property(k)
    expect(data[k]).to.be.a('string')
  })
  if (expectClientKey) { expect(data.clientKey).to.equal(expectClientKey) }
  expect(/^\r?\n*-----BEGIN CERTIFICATE REQUEST-----\r?\n/.test(data.csr)).to.be.true()
  expect(/\r?\n-----END CERTIFICATE REQUEST-----\r?\n*$/.test(data.csr)).to.be.true()
}

function checkCertificate (data, selfsigned) {
  expect(data).to.be.an('object');
  ['certificate', 'clientKey', 'serviceKey', 'csr'].forEach(function (k) {
    expect(data).to.have.property(k)
    expect(data[k]).to.be.a('string')
  })
  expect(/^\r?\n*-----BEGIN CERTIFICATE-----\r?\n/.test(data.certificate)).to.be.true()
  expect(/\r?\n-----END CERTIFICATE-----\r?\n*$/.test(data.certificate)).to.be.true()
  if (selfsigned) { expect(data.clientKey).to.equal(data.serviceKey) } else { expect(data.clientKey).to.not.equal(data.serviceKey) }
}

function checkCertificateData (data, info) {
  expect(data).to.deep.equal(info)
}

function checkPublicKey (data) {
  expect(data).to.be.an('object').that.has.property('publicKey')
  expect(data.publicKey).to.be.a('string')
  expect(/^\r?\n*-----BEGIN PUBLIC KEY-----\r?\n/.test(data.publicKey)).to.be.true()
  expect(/\r?\n-----END PUBLIC KEY-----\r?\n*$/.test(data.publicKey)).to.be.true()
}

function checkFingerprint (data) {
  expect(data).to.be.an('object').that.has.property('fingerprint')
  expect(data.fingerprint).to.be.a('string')
  expect(/^[0-9A-F]{2}(:[0-9A-F]{2}){19}$/.test(data.fingerprint)).to.be.true()
}

function checkModulus (data, encryptAlgorithm) {
  expect(data).to.be.an('object').that.has.property('modulus')
  expect(data.modulus).to.be.a('string')
  switch (encryptAlgorithm) {
    case 'md5':
      expect(/^[a-f0-9]{32}$/i.test(data.modulus)).to.be.true()
      break
    default:
      expect(/^[0-9A-F]*$/.test(data.modulus)).to.be.true()
      break
  }
}

module.exports = {
  checkTmpEmpty: checkTmpEmpty,
  checkError: checkError,
  checkDhparam: checkDhparam,
  checkEcparam: checkEcparam,
  checkEcparamNoOut: checkEcparamNoOut,
  checkPrivateKey: checkPrivateKey,
  checkCSR: checkCSR,
  checkCertificate: checkCertificate,
  checkCertificateData: checkCertificateData,
  checkPublicKey: checkPublicKey,
  checkFingerprint: checkFingerprint,
  checkModulus: checkModulus
}
