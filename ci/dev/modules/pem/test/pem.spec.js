'use strict'

var pem = require('..')
var fs = require('fs')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

describe('General Tests', function () {
  this.timeout(300000)// 5 minutes
  this.slow(2000)// 2 seconds

  describe('Requirements', function () {
    it('Create tmp folder', function () {
      expect(function () {
        if (!fs.existsSync(process.env.PEMJS_TMPDIR)) {
          fs.mkdirSync(process.env.PEMJS_TMPDIR)
        }
      }).to.not.throw()
    })

    it('Return an error if openssl was not found', function (done) {
      pem.config({
        pathOpenSSL: 'zzzzzzzzzzz'
      })
      pem.createPrivateKey(function (error) {
        hlp.checkError(error, true)
        pem.config({
          pathOpenSSL: process.env.OPENSSL_BIN || 'openssl'
        })
        pem.createPrivateKey(function (error) {
          hlp.checkError(error)
          done()
        })
      })
    })
  })

  describe('#.createDhparam tests', function () {
    it('Create default sized dhparam key', function (done) {
      pem.createDhparam(function (error, data) {
        hlp.checkError(error)
        hlp.checkDhparam(data, 150, 160)
        hlp.checkTmpEmpty()
        done()
      })
    })
    it('Create 1024bit dhparam key', function (done) {
      this.timeout(600000)// 10 minutes
      pem.createDhparam(1024, function (error, data) {
        hlp.checkError(error)
        hlp.checkDhparam(data, 240, 250)
        hlp.checkTmpEmpty()
        done()
      })
    })
  })

  describe('#.createEcparam tests', function () {
    it('Create default ecparam key', function (done) {
      pem.createEcparam(function (error, data) {
        hlp.checkError(error)
        hlp.checkEcparam(data, 430, 470)
        hlp.checkTmpEmpty()
        done()
      })
    })
    it('Create secp521k1 ecparam key', function (done) {
      pem.createEcparam('secp521r1', function (error, data) {
        hlp.checkError(error)
        hlp.checkEcparam(data, 960, 1000)
        hlp.checkTmpEmpty()
        done()
      })
    })
    it('Create prime256v1 ecparam key', function (done) {
      pem.createEcparam('prime256v1', function (error, data) {
        hlp.checkError(error)
        hlp.checkEcparam(data, 430, 570)
        hlp.checkTmpEmpty()
        done()
      })
    })
    it('Create prime256v1 ecparam key with named_curve param encoding', function (done) {
      pem.createEcparam('prime256v1', 'named_curve', function (error, data) {
        hlp.checkError(error)
        hlp.checkEcparam(data, 200, 430)
        hlp.checkTmpEmpty()
        done()
      })
    })
    it('Create prime256v1 ecparam key with noOut set to true', function (done) {
      pem.createEcparam('prime256v1', 'named_curve', true, function (error, data) {
        hlp.checkError(error)
        hlp.checkEcparamNoOut(data, 200, 430)
        hlp.checkTmpEmpty()
        done()
      })
    })
    it('Create prime256v1 ecparam key with noOut set to false', function (done) {
      pem.createEcparam('prime256v1', 'named_curve', false, function (error, data) {
        hlp.checkError(error)
        hlp.checkEcparam(data, 200, 430)
        hlp.checkTmpEmpty()
        done()
      })
    })
  })

  describe('#.createPrivateKey tests', function () {
    describe('default sized private key', function () {
      var pkey
      it('create private key', function (done) {
        pem.createPrivateKey(function (error, data) {
          hlp.checkError(error)
          hlp.checkPrivateKey(data, 850, 1900)
          hlp.checkTmpEmpty()
          pkey = data
          done()
        })
      })

      it('get its public key', function (done) {
        pem.getPublicKey(pkey.key, function (error, data) {
          hlp.checkError(error)
          hlp.checkPublicKey(data)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('create csr and check key', function (done) {
        pem.createCSR({
          clientKey: pkey.key
        }, function (error, data) {
          hlp.checkError(error)
          hlp.checkCSR(data, pkey.key)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('create pkcs12 w/o password', function (done) {
        pem.createCertificate({
          clientKey: pkey.key,
          selfSigned: true
        }, function (error, data) {
          hlp.checkError(error)

          pem.createPkcs12(data.clientKey, data.certificate, 'mypassword', function (error, pkcs12) {
            hlp.checkError(error)
            expect(pkcs12).to.be.ok()
            hlp.checkTmpEmpty()
            done()
          })
        })
      })
    })

    describe('2048bit Private key', function () {
      var pwkey
      it('create private key', function (done) {
        pem.createPrivateKey(2048, function (error, data) {
          hlp.checkError(error)
          hlp.checkPrivateKey(data, 1650, 1710)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('create private key with password', function (done) {
        pem.createPrivateKey(2048, {
          cipher: 'aes128',
          password: 'min4chars'
        }, function (error, data) {
          hlp.checkError(error)
          hlp.checkPrivateKey(data, 1700, 1800, true)
          hlp.checkTmpEmpty()
          pwkey = data
          done()
        })
      })

      it('create csr using private key with password', function (done) {
        pem.createCSR({
          clientKey: pwkey.key,
          clientKeyPassword: 'min4chars'
        }, function (error, data) {
          hlp.checkError(error)
          hlp.checkCSR(data, pwkey.key)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('create cert using serviceKeyPassword', function (done) {
        pem.createCertificate({
          serviceKeyPassword: 'min4chars',
          selfSigned: true
        }, function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data, true)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('create cert using pkey w/ password; create pkcs12', function (done) {
        pem.createCertificate({
          clientKey: pwkey.key,
          clientKeyPassword: 'min4chars',
          selfSigned: true
        }, function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data, true)
          hlp.checkTmpEmpty()

          pem.createPkcs12(data.clientKey, data.certificate, 'mypassword', {
            cipher: 'aes256',
            clientKeyPassword: 'min4chars'
          }, function (error, pkcs12) {
            hlp.checkError(error)
            expect(pkcs12).to.be.ok()
            hlp.checkTmpEmpty()
            done()
          })
        })
      })
    })
  })

  describe('#.createCSR tests', function () {
    it('Create default CSR; get its public key; read its data', function (done) {
      pem.createCSR(function (error, data1) {
        hlp.checkError(error)
        hlp.checkCSR(data1)
        hlp.checkTmpEmpty()

        pem.getPublicKey(data1.clientKey, function (error, data2) {
          hlp.checkError(error)
          hlp.checkPublicKey(data2)
          hlp.checkTmpEmpty()

          pem.readCertificateInfo(data1.csr, function (error, data3) {
            hlp.checkError(error)
            hlp.checkCertificateData(data3, {
              issuer: {},
              country: '',
              state: '',
              locality: '',
              organization: '',
              organizationUnit: '',
              commonName: 'localhost',
              emailAddress: '',
              dc: '',
              signatureAlgorithm: 'sha256WithRSAEncryption',
              publicKeyAlgorithm: 'rsaEncryption',
              publicKeySize: '2048 bit'
            })
            hlp.checkTmpEmpty()
            done()
          })
        })
      })
    })

    it('Create CSR using config file', function (done) {
      pem.createCSR({
        csrConfigFile: './test/fixtures/test.cnf'
      }, function (error, data) {
        hlp.checkError(error)
        hlp.checkCSR(data)
        hlp.checkTmpEmpty()

        pem.readCertificateInfo(data.csr, function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificateData(data, {
            issuer: {},
            country: 'EE',
            state: 'Harjumaa',
            locality: 'Tallinn',
            organization: 'Node.ee',
            organizationUnit: 'test',
            commonName: 'www.node.ee',
            emailAddress: 'andris@node.ee',
            dc: '',
            signatureAlgorithm: 'sha256WithRSAEncryption',
            publicKeyAlgorithm: 'rsaEncryption',
            publicKeySize: '2048 bit'
          })
          hlp.checkTmpEmpty()
          done()
        })
      })
    })

    it('Create CSR with multiple organizations using config file', function (done) {
      pem.createCSR({
        issuer: {},
        country: 'EE',
        state: 'Harjumaa',
        locality: 'Tallinn',
        organization: ['Node2.ee', 'Node.ee'],
        organizationUnit: 'test',
        commonName: 'www.node.ee',
        emailAddress: 'andris@node.ee',
        dc: '',
        signatureAlgorithm: 'sha256WithRSAEncryption',
        publicKeyAlgorithm: 'rsaEncryption',
        publicKeySize: '2048 bit'
      }, function (error, data) {
        hlp.checkError(error)
        hlp.checkCSR(data)
        hlp.checkTmpEmpty()

        pem.readCertificateInfo(data.csr, function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificateData(data, {
            issuer: {},
            country: 'EE',
            state: 'Harjumaa',
            locality: 'Tallinn',
            organization: ['Node.ee', 'Node2.ee'],
            organizationUnit: 'test',
            commonName: 'www.node.ee',
            emailAddress: 'andris@node.ee',
            dc: '',
            signatureAlgorithm: 'sha256WithRSAEncryption',
            publicKeyAlgorithm: 'rsaEncryption',
            publicKeySize: '2048 bit'
          })
          hlp.checkTmpEmpty()
          done()
        })
      })
    })

    it('Read edited cert data from CSR', function (done) {
      var certInfo = {
        issuer: {},
        country: 'EE',
        state: 'Harjumaa',
        locality: 'Tallinn',
        organization: 'Node.ee',
        organizationUnit: 'test',
        commonName: 'www.node.ee',
        emailAddress: 'andris@node.ee',
        dc: '',
        signatureAlgorithm: 'sha256WithRSAEncryption',
        publicKeyAlgorithm: 'rsaEncryption',
        publicKeySize: '2048 bit'
      }
      pem.createCSR(Object.create(certInfo), function (error, data) {
        hlp.checkError(error)
        hlp.checkCSR(data)
        hlp.checkTmpEmpty()

        pem.readCertificateInfo(data.csr, function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificateData(data, certInfo)
          hlp.checkTmpEmpty()
          done()
        })
      })
    })
  })

  describe('#.createCertificate tests', function () {
    describe('Default certificate', function () {
      var cert
      it('Create default certificate', function (done) {
        pem.createCertificate(function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data)
          hlp.checkTmpEmpty()
          cert = data
          done()
        })
      })

      it('get its public key', function (done) {
        pem.getPublicKey(cert.clientKey, function (error, data) {
          hlp.checkError(error)
          hlp.checkPublicKey(data)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('get its fingerprint', function (done) {
        pem.getFingerprint(cert.certificate, function (error, data) {
          hlp.checkError(error)
          hlp.checkFingerprint(data)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('get its modulus [not hashed]', function (done) {
        pem.getModulus(cert.certificate, function (error,
          data) {
          hlp.checkError(error)
          hlp.checkModulus(data)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('get its modulus [md5 hashed]', function (done) {
        pem.getModulus(cert.certificate, null, 'md5',
          function (error, data) {
            hlp.checkError(error)
            hlp.checkModulus(data, 'md5')
            hlp.checkTmpEmpty()
            done()
          })
      })

      it('read its data', function (done) {
        pem.readCertificateInfo(cert.certificate, function (
          error, data) {
          hlp.checkError(error);
          ['validity', 'serial', 'signatureAlgorithm',
            'publicKeySize', 'publicKeyAlgorithm'
          ].forEach(function (k) {
            if (data[k]) { delete data[k] }
          })
          hlp.checkCertificateData(data, {
            issuer: {
              country: '',
              state: '',
              locality: '',
              organization: '',
              organizationUnit: '',
              commonName: 'localhost',
              dc: ''
            },
            country: '',
            state: '',
            locality: '',
            organization: '',
            organizationUnit: '',
            commonName: 'localhost',
            emailAddress: '',
            dc: ''
          })
          hlp.checkTmpEmpty()
          done()
        })
      })
    })

    describe('SAN certificate', function () {
      var cert
      it('Create default certificate', function (done) {
        var d = fs.readFileSync('./test/fixtures/ru_openssl.csr').toString()
        pem.createCertificate({ csr: d }, function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data)
          hlp.checkTmpEmpty()
          cert = data
          done()
        })
      })

      it('get its fingerprint', function (done) {
        pem.getFingerprint(cert.certificate, function (error, data) {
          hlp.checkError(error)
          hlp.checkFingerprint(data)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('get its modulus [not hashed]', function (done) {
        pem.getModulus(cert.certificate, function (error,
          data) {
          hlp.checkError(error)
          hlp.checkModulus(data)
          hlp.checkTmpEmpty()
          done()
        })
      })

      it('get its modulus [md5 hashed]', function (done) {
        pem.getModulus(cert.certificate, null, 'md5',
          function (error, data) {
            hlp.checkError(error)
            hlp.checkModulus(data, 'md5')
            hlp.checkTmpEmpty()
            done()
          })
      })

      it('read its data', function (done) {
        pem.readCertificateInfo(cert.certificate, function (
          error, data) {
          hlp.checkError(error);
          ['validity', 'serial', 'signatureAlgorithm',
            'publicKeySize', 'publicKeyAlgorithm'
          ].forEach(function (k) {
            if (data[k]) { delete data[k] }
          })
          hlp.checkCertificateData(data, {
            commonName: 'Описание сайта',
            country: 'RU',
            dc: '',
            emailAddress: 'envek@envek.name',
            issuer: {
              commonName: 'Описание сайта',
              country: 'RU',
              dc: '',
              locality: 'Москва',
              organization: 'Моя компания',
              organizationUnit: 'Моё подразделение',
              state: ''
            },
            locality: 'Москва',
            organization: 'Моя компания',
            organizationUnit: 'Моё подразделение',
            san: {
              dns: [
                'example.com',
                '*.example.com'
              ],
              email: [],
              ip: []
            },
            state: ''
          })
          hlp.checkTmpEmpty()
          done()
        })
      })
    })

    describe('CA certificate', function () {
      var ca
      it('create ca certificate', function (done) {
        pem.createCertificate({
          commonName: 'CA Certificate'
        },
        function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data)
          hlp.checkTmpEmpty()
          ca = data
          done()
        })
      })
      it('create certificate with text serial "demo-serial"', function (done) {
        pem.createCertificate({
          serviceKey: ca.serviceKey,
          serviceCertificate: ca.certificate,
          serial: 'demo-serial'
        },
        function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data)
          hlp.checkTmpEmpty()
          pem.readCertificateInfo(data.certificate, function (error, data) {
            hlp.checkError(error);
            ['validity', 'serial'].forEach(function (k) {
              if (data[k]) {
                delete data[k]
              }
            })
            hlp.checkTmpEmpty()
            done()
          })
        })
      })
      it('create certificate with hex serial "0x1234567890abcdef"', function (done) {
        pem.createCertificate({
          serviceKey: ca.serviceKey,
          serviceCertificate: ca.certificate,
          serial: '0x1234567890abcdef'
        },
        function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data)
          hlp.checkTmpEmpty()
          pem.readCertificateInfo(data.certificate, function (error, data) {
            hlp.checkError(error);
            ['validity', 'serial'].forEach(function (k) {
              if (data[k]) {
                delete data[k]
              }
            })
            hlp.checkTmpEmpty()
            done()
          })
        })
      })
      it('create certificate with hex serial "1234567890abcdef"', function (done) {
        pem.createCertificate({
          serviceKey: ca.serviceKey,
          serviceCertificate: ca.certificate,
          serial: '1234567890abcdef'
        },
        function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data)
          hlp.checkTmpEmpty()
          pem.readCertificateInfo(data.certificate, function (error, data) {
            hlp.checkError(error);
            ['validity', 'serial'].forEach(function (k) {
              if (data[k]) {
                delete data[k]
              }
            })
            hlp.checkTmpEmpty()
            done()
          })
        })
      })
      it('create certificate with number serial "1234567890"', function (done) {
        pem.createCertificate({
          serviceKey: ca.serviceKey,
          serviceCertificate: ca.certificate,
          serial: 1234567890
        },
        function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data)
          hlp.checkTmpEmpty()
          pem.readCertificateInfo(data.certificate, function (error, data) {
            hlp.checkError(error);
            ['validity', 'serial'].forEach(function (k) {
              if (data[k]) {
                delete data[k]
              }
            })
            hlp.checkTmpEmpty()
            done()
          })
        })
      })
      it('verify signing chain; create and read PKCS12', function (done) {
        pem.createCertificate({
          serviceKey: ca.serviceKey,
          serviceCertificate: ca.certificate,
          serial: Date.now()
        }, function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data)
          hlp.checkTmpEmpty()

          pem.verifySigningChain(data.certificate,
            ca.certificate,
            function (error, valid) {
              hlp.checkError(error)
              expect(valid).to.be.true()

              pem.createPkcs12(data.clientKey,
                data.certificate, '', {
                  certFiles: [ca.certificate]
                },
                function (error, d) {
                  hlp.checkError(error)
                  expect(d).to.be.ok()
                  hlp.checkTmpEmpty()

                  pem.readPkcs12(d.pkcs12,
                    function (error, keystore) {
                      hlp.checkError(error)
                      expect(keystore).to.be.an('object')
                      expect(keystore).to.have.property('ca')
                      expect(keystore).to.have.property('cert')
                      expect(keystore).to.have.property('key')
                      expect(keystore.ca).to.be.an('array')
                      expect(keystore.cert).to.be.an('string')
                      expect(keystore.key).to.be.an('string')
                      expect(keystore.ca[0]).to.equal(ca.certificate)
                      expect(keystore.cert).to.equal(data.certificate)
                      expect(keystore.key).to.equal(data.clientKey)
                      done()
                    })
                })
            })
        })
      })
      it('Fail to verify invalid sigining chain', function (done) {
        pem.createCertificate({
          serviceKey: ca.serviceKey,
          serviceCertificate: ca.certificate,
          serial: Date.now()
        }, function (error, data) {
          hlp.checkError(error)
          hlp.checkCertificate(data)
          hlp.checkTmpEmpty()

          pem.verifySigningChain(data.certificate,
            data.certificate,
            function (error, valid) {
              hlp.checkError(error)
              expect(valid).to.be.false()
              done()
            })
        })
      })
      it('Verify google.com certificate without provided CA certificates', function (done) {
        var certificate = fs.readFileSync('./test/fixtures/google.com.pem').toString()
        pem.verifySigningChain(certificate, function (error, valid) {
          hlp.checkError(error)
          expect(valid).to.be.false()
          done()
        })
      })
      it('Verify deep sigining chain', function (done) {
        pem.createCertificate({
          commonName: 'Intermediate CA Certificate',
          serviceKey: ca.serviceKey,
          serviceCertificate: ca.certificate,
          serial: Date.now()
        }, function (error, intermediate) {
          hlp.checkError(error)
          hlp.checkCertificate(intermediate)
          hlp.checkTmpEmpty()

          pem.createCertificate({
            serviceKey: intermediate.clientKey,
            serviceCertificate: intermediate.certificate,
            serial: Date.now()
            // days: 1024
          }, function (error, cert) {
            hlp.checkError(error)
            hlp.checkCertificate(cert)
            hlp.checkTmpEmpty()

            // chain check ok
            pem.verifySigningChain([intermediate.certificate, cert.certificate], [
              ca.certificate, intermediate.certificate
            ], function (error, valid) {
              hlp.checkError(error)
              expect(valid).to.be.true()

              // chain check fails -> missing ca cert in chain
              pem.verifySigningChain(cert.certificate, [
                intermediate.certificate
              ], function (error, valid) {
                hlp.checkError(error)
                expect(valid).to.be.false()

                // chain check fails -> missing intermediate cert in chain
                pem.verifySigningChain(
                  cert.certificate, [
                    ca.certificate
                  ],
                  function (error,
                    valid) {
                    hlp.checkError(error)
                    expect(valid).to.be.false()
                    done()
                  })
              })
            })
          })
        })
      })
    })

    it('Create self signed certificate', function (done) {
      pem.createCertificate({
        selfSigned: true
      }, function (error, data) {
        hlp.checkError(error)
        hlp.checkCertificate(data, true)
        hlp.checkTmpEmpty()
        done()
      })
    })
    it('Create and verify wildcard certificate', function (done) {
      var certInfo = {
        commonName: '*.node.ee'
      }
      pem.createCertificate(Object.create(certInfo), function (error, data) {
        hlp.checkError(error)
        hlp.checkCertificate(data)
        hlp.checkTmpEmpty()

        pem.readCertificateInfo(data.certificate, function (error, data) {
          hlp.checkError(error)
          expect(data).to.be.an('object').that.has.property('commonName')
          expect(data.commonName).to.equal(certInfo.commonName)
          hlp.checkTmpEmpty()
          done()
        })
      })
    })
    it('Read edited cert data from certificate', function (done) {
      var certInfo = {
        issuer: {
          country: 'EE',
          state: 'Harjumaa',
          locality: 'Tallinn',
          organization: 'Node.ee',
          organizationUnit: 'test',
          commonName: 'www.node.ee',
          dc: ''
        },
        country: 'EE',
        state: 'Harjumaa',
        locality: 'Tallinn',
        organization: 'Node.ee',
        organizationUnit: 'test',
        commonName: 'www.node.ee',
        emailAddress: 'andris@node.ee',
        dc: '',
        signatureAlgorithm: 'sha256WithRSAEncryption',
        publicKeyAlgorithm: 'rsaEncryption',
        publicKeySize: '2048 bit'
      }
      pem.createCertificate(Object.create(certInfo), function (error, data) {
        hlp.checkError(error)
        hlp.checkCertificate(data)
        hlp.checkTmpEmpty()

        pem.readCertificateInfo(data.certificate, function (error, data) {
          hlp.checkError(error);
          ['validity', 'serial'].forEach(function (k) {
            if (data[k]) { delete data[k] }
          })
          hlp.checkCertificateData(data, certInfo)
          hlp.checkTmpEmpty()
          done()
        })
      })
    })

    it('Read CertInformation form ./test/fixtures/pem196.pem', function (done) {
      var certInfo = {
        issuer: {
          country: 'BO',
          state: '',
          locality: '',
          organization: 'ADSIB',
          organizationUnit: '',
          commonName: 'Entidad Certificadora Publica ADSIB',
          dc: ''
        },
        serial: '2854046357827755658 (0x279b9c0a82d21e8a)',
        '1.3.6.1.1.1.1.0': '#0C0734373132323836',
        dnQualifier: 'CI',
        country: 'BO',
        state: '',
        locality: '',
        organization: '',
        organizationUnit: '',
        commonName: 'ILSE SILES BECERRA',
        emailAddress: '',
        dc: '',
        validity: {
          start: 1524175291000,
          end: 1524434491000
        },
        signatureAlgorithm: 'sha256WithRSAEncryption',
        publicKeySize: '2048 bit',
        publicKeyAlgorithm: 'rsaEncryption'
      }

      var d = fs.readFileSync('./test/fixtures/pem196.pem').toString()
      pem.readCertificateInfo(d, function (error, data) {
        if (data.serial) delete data.serial
        if (certInfo.serial) delete certInfo.serial
        hlp.checkError(error)
        hlp.checkCertificateData(data, certInfo)
        hlp.checkTmpEmpty()
        done()
      })
    })

    it('Read CertInformation from ./test/fixtures/ru_openssl.crt', function (done) {
      var certInfo = {
        issuer: {
          country: 'RU',
          state: '',
          locality: 'Москва',
          organization: 'Моя компания',
          organizationUnit: 'Моё подразделение',
          commonName: 'Описание сайта',
          dc: ''
        },
        country: 'RU',
        state: '',
        locality: 'Москва',
        organization: 'Моя компания',
        organizationUnit: 'Моё подразделение',
        commonName: 'Описание сайта',
        emailAddress: 'envek@envek.name',
        dc: '',
        validity: {
          end: 1568233615000,
          start: 1536697615000
        },
        san: {
          dns: [
            'example.com',
            '*.app.example.com',
            'www.example.com'
          ],
          email: [],
          ip: []
        },
        signatureAlgorithm: 'sha256WithRSAEncryption',
        publicKeySize: '4096 bit',
        publicKeyAlgorithm: 'rsaEncryption'
      }

      var d = fs.readFileSync('./test/fixtures/ru_openssl.crt').toString()
      pem.readCertificateInfo(d, function (error, data) {
        if (data.serial) delete data.serial
        if (certInfo.serial) delete certInfo.serial
        hlp.checkError(error)
        hlp.checkCertificateData(data, certInfo)
        hlp.checkTmpEmpty()
        done()
      })
    })

    it('Read CertInformation from ./test/fixtures/cn_openssl.crt', function (done) {
      var certInfo = {
        issuer: {
          country: 'RU',
          state: '',
          locality: '兰克福',
          organization: '法兰克福分行',
          organizationUnit: '克福分',
          commonName: '中国银行',
          dc: ''
        },
        serial: '2854046357827755658 (0x279b9c0a82d21e8a)',
        country: 'RU',
        state: '',
        locality: '兰克福',
        organization: '法兰克福分行',
        organizationUnit: '克福分',
        commonName: '中国银行',
        emailAddress: 'envek@envek.name',
        dc: '',
        validity: {
          end: 1568233543000,
          start: 1536697543000
        },
        san: {
          dns: [
            'example.com',
            '*.app.example.com',
            'www.example.com'
          ],
          email: [],
          ip: []
        },
        signatureAlgorithm: 'sha256WithRSAEncryption',
        publicKeySize: '4096 bit',
        publicKeyAlgorithm: 'rsaEncryption'
      }

      var d = fs.readFileSync('./test/fixtures/cn_openssl.crt').toString()
      pem.readCertificateInfo(d, function (error, data) {
        if (data.serial) delete data.serial
        if (certInfo.serial) delete certInfo.serial
        hlp.checkError(error)
        hlp.checkCertificateData(data, certInfo)
        hlp.checkTmpEmpty()
        done()
      })
    })
  })

  describe('#.checkCertificate tests', function () {
    it('Check certificate file @ ./test/fixtures/test.key', function (done) {
      var d = fs.readFileSync('./test/fixtures/test.key').toString()
      pem.checkCertificate(d, 'password', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.ok()
        done()
      })
    })
    it('Check certificate file @ ./test/fixtures/test.crt', function (done) {
      var d = fs.readFileSync('./test/fixtures/test.crt').toString()
      pem.checkCertificate(d, function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.ok()
        done()
      })
    })
    it('Check certificate file @ ./test/fixtures/test.csr', function (done) {
      var d = fs.readFileSync('./test/fixtures/test.csr').toString()
      pem.checkCertificate(d, function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.ok()
        done()
      })
    })
  })

  describe('#.getModulus tests', function () {
    it('Check matching modulus of  key and cert file', function (done) {
      var f = fs.readFileSync('./test/fixtures/test.crt').toString()
      pem.getModulus(f, function (error, data1) {
        hlp.checkError(error)
        hlp.checkModulus(data1)
        hlp.checkTmpEmpty()

        f = fs.readFileSync('./test/fixtures/test.key').toString()
        pem.getModulus(f, 'password', function (error, data2) {
          hlp.checkError(error)
          hlp.checkModulus(data2)
          expect(data1.modulus).to.equal(data2.modulus)
          hlp.checkTmpEmpty()
          done()
        })
      })
    })
  })

  describe('#.getDhparamInfo tests', function () {
    it('Get DH param info', function (done) {
      var dh = fs.readFileSync('./test/fixtures/test.dh').toString()
      pem.getDhparamInfo(dh, function (error, data) {
        hlp.checkError(error)
        var size = (data && data.size) || 0
        var prime = ((data && data.prime) || '').toString()
        expect(size).to.be.a('number')
        expect(size).to.equal(1024)
        expect(prime).to.be.a('string')
        expect(/([0-9a-f][0-9a-f]:)+[0-9a-f][0-9a-f]$/g.test(prime)).to.be.true()
        hlp.checkTmpEmpty()
        done()
      })
    })
  })

  describe('#.readPkcs12 tests', function () {
    it('Respond with ENOENT for missing PKCS12 file', function (
      done) {
      pem.readPkcs12('/i/do/not/exist.p12', function (error) {
        hlp.checkError(error, {
          code: 'ENOENT'
        })
        done()
      })
    })
  })

  describe('#.checkPkcs12 tests', function () {
    it('Check PKCS12 keystore', function (done) {
      var pkcs12 = fs.readFileSync('./test/fixtures/idsrv3test.pfx')
      pem.checkPkcs12(pkcs12, 'idsrv3test', function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.ok()
        done()
      })
    })
  })
})
