pem
===

Create private keys and certificates with node.js

[![Build Status](https://secure.travis-ci.org/Dexus/pem.png)](http://travis-ci.org/Dexus/pem) [![npm version](https://badge.fury.io/js/pem.svg)](http://badge.fury.io/js/pem) [![npm downloads](https://img.shields.io/npm/dt/pem.svg)](https://www.npmjs.com/package/pem) [![pem documentation](https://img.shields.io/badge/pem-documentation-0099ff.svg?style=flat)](https://dexus.github.io/pem/jsdoc/) [![Greenkeeper badge](https://badges.greenkeeper.io/Dexus/pem.svg)](https://greenkeeper.io/)


[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

## Installation

Install with npm

    npm install pem

## Examples

Here are some examples for creating an SSL key/cert on the fly, and running an HTTPS server on port 443.  443 is the standard HTTPS port, but requires root permissions on most systems.  To get around this, you could use a higher port number, like 4300, and use https://localhost:4300 to access your server.

### Basic https
```javascript
var https = require('https')
var pem = require('pem')

pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
  if (err) {
    throw err
  }
  https.createServer({ key: keys.serviceKey, cert: keys.certificate }, function (req, res) {
    res.end('o hai!')
  }).listen(443)
})
```

###  Express
```javascript
var https = require('https')
var pem = require('pem')
var express = require('express')

pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
  if (err) {
    throw err
  }
  var app = express()

  app.get('/', function (req, res) {
    res.send('o hai!')
  })

  https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(443)
})
```

## API
Please have a look into the [API documentation](https://dexus.github.io/pem/jsdoc/).

_we had to clean up a bit_
<!--
### Create a dhparam key

Use `createDhparam` for creating dhparam keys

    pem.createDhparam(keyBitsize, callback)

Where

  * **keyBitsize** is an optional size of the key, defaults to 512 (bit)
  * **callback** is a callback function with an error object and `{dhparam}`

### Create a ecparam key

Use `createEcparam` for creating ecparam keys

    pem.createEcparam(keyName, callback)

Where

  * **keyName** is an optional name of the key curves name, defaults to secp256k1
  * **callback** is a callback function with an error object and `{ecparam}`

### Create a private key

Use `createPrivateKey` for creating private keys

    pem.createPrivateKey(keyBitsize, [options,] callback)

Where

  * **keyBitsize** is an optional size of the key, defaults to 2048 (bit)
  * **options** is an optional object of the cipher and password (both required for encryption), defaults {cipher:'',password:''}
  (ciphers:["aes128", "aes192", "aes256", "camellia128", "camellia192", "camellia256", "des", "des3", "idea"])
  * **callback** is a callback function with an error object and `{key}`

### Create a Certificate Signing Request

Use `createCSR` for creating certificate signing requests

    pem.createCSR(options, callback)

Where

  * **options** is an optional options object
  * **callback** is a callback function with an error object and `{csr, clientKey}`

Possible options are the following

  * **clientKey** is an optional client key to use
  * **clientKeyPassword** the optional password for `clientKey`
  * **keyBitsize** - if `clientKey` is undefined, bit size to use for generating a new key (defaults to 2048)
  * **hash** is a hash function to use (either `md5`, `sha1` or `sha256`, defaults to `sha256`)
  * **country** is a CSR country field
  * **state** is a CSR state field
  * **locality** is a CSR locality field
  * **organization** is a CSR organization field
  * **organizationUnit** is a CSR organizational unit field
  * **commonName** is a CSR common name field (defaults to `localhost`)
  * **altNames** is a list (`Array`) of subjectAltNames in the subjectAltName field (optional)
  * **emailAddress** is a CSR email address field
  * **csrConfigFile** is a CSR config file

### Create a certificate

Use `createCertificate` for creating private keys

    pem.createCertificate(options, callback)

Where

  * **options** is an optional options object
  * **callback** is a callback function with an error object and `{certificate, csr, clientKey, serviceKey}`

Possible options include all the options for `createCSR` - in case `csr` parameter is not defined and a new
CSR needs to be generated.

In addition, possible options are the following

  * **serviceKey** is a private key for signing the certificate, if not defined a new one is generated
  * **serviceKeyPassword** Password of the service key
  * **serviceCertificate** is the optional certificate for the `serviceKey`
  * **serial** is the unique serial number for the signed certificate, required if `serviceCertificate` is defined
  * **selfSigned** - if set to true and `serviceKey` is not defined, use `clientKey` for signing
  * **csr** is a CSR for the certificate, if not defined a new one is generated
  * **days** is the certificate expire time in days
  * **extFile** extension config file - **without** `-extensions v3_req`
  * **config** extension config file - **with** `-extensions v3_req`

### Export a public key

Use `getPublicKey` for exporting a public key from a private key, CSR or certificate

    pem.getPublicKey(certificate, callback)

Where

  * **certificate** is a PEM encoded private key, CSR or certificate
  * **callback** is a callback function with an error object and `{publicKey}`

### Read certificate info

Use `readCertificateInfo` for reading subject data from a certificate or a CSR

    pem.readCertificateInfo(certificate, callback)

Where

  * **certificate** is a PEM encoded CSR or a certificate
  * **callback** is a callback function with an error object and `{serial, country, state, locality, organization, organizationUnit, commonName, emailAddress, validity{start, end}, san{dns, ip, email}?, issuer{country, state, locality, organization, organizationUnit}, signatureAlgorithm, publicKeyAlgorithm, publicKeySize }`

? *san* is only present if the CSR or certificate has SAN entries.

*signatureAlgorithm, publicKeyAlgorithm and publicKeySize* only available if supportet and can parsed form openssl output

### Get fingerprint

Use `getFingerprint` to get the default SHA1 fingerprint for a certificate

    pem.getFingerprint(certificate, [hash], callback)

Where

  * **certificate** is a PEM encoded certificate
  * **hash** is a hash function to use (either `md5`, `sha1` or `sha256`, defaults to `sha1`)
  * **callback** is a callback function with an error object and `{fingerprint}`

### Get modulus

Use `getModulus` to get the modulus for a certificate, a CSR or a private key. Modulus can be useful to check that a Private Key Matches a Certificate

    pem.getModulus(certificate, [password], [hash], callback)

Where

  * **certificate** is a PEM encoded certificate, CSR or private key
  * **password** is an optional passphrase for passpharse protected certificates
  * **hash** is an optional hash function to use (up to now `md5` supported) (default: none)
  * **callback** is a callback function with an error object and `{modulus}`

### Get DH parameter information

Use `getDhparamInfo` to get the size and prime of DH parameters.

    pem.getDhparamInfo(dhparam, callback)

Where

  * **dhparam** is a PEM encoded DH parameters string
  * **callback** is a callback function with an error object and `{size, prime}`


### Export to a PKCS12 keystore

Use `createPkcs12` to export a certificate, the private key and optionally any signing or intermediate CA certificates to a PKCS12 keystore.

	pem.createPkcs12(clientKey, certificate, p12Password, [options], callback)

Where

* **clientKey** is a PEM encoded private key
* **certificate** is a PEM encoded certificate
* **p12Password** is the password of the exported keystore
* **options** is an optional options object with `cipher`, (one of "aes128", "aes192", "aes256", "camellia128", "camellia192", "camellia256", "des", "des3" or "idea"), `clientKeyPassword` and `certFiles` (an array of additional certificates to include - e.g. CA certificates)
* **callback** is a callback function with an error object and `{pkcs12}` (binary)

### Read a PKCS12 keystore

Use `readPkcs12` to read a certificate, private key and CA certificates from a PKCS12 keystore.

	pem.readPkcs12(bufferOrPath, [options], callback)

Where

* **bufferOrPath** is a PKCS12 keystore as a [Buffer](https://nodejs.org/api/buffer.html) or the path to a file
* **options** is an optional options object with `clientKeyPassword` which will be used to encrypt the stored key and `p12Password` which will be used to open the keystore
* **callback** is a callback function with an error object and `{key: String, cert: String, ca: Array}`

### Check a PKCS12 keystore

Use `checkPkcs12` to check a PKCS12 keystore.

	pem.checkPkcs12(bufferOrPath, [passphrase], callback)

Where

* **bufferOrPath** is a PKCS12 keystore as a [Buffer](https://nodejs.org/api/buffer.html) or the path to a file
* **passphrase** is an optional passphrase which will be used to open the keystore
* **callback** is a callback function with an error object and a boolean as arguments

### Verify a certificate signing chain

Use `verifySigningChain` to assert that a given certificate has a valid signing chain.

    pem.verifySigningChain(certificate, ca, callback)

Where

* **certificate** is a PEM encoded certificate string
* **ca** is a PEM encoded CA certificate string or an array of certificate strings
* **callback** is a callback function with an error object and a boolean as arguments

### Check a certificate file

Use `checkCertificate` to check / verify consistency of a certificate.

    pem.checkCertificate(certificate, callback)

Where

* **certificate** is a PEM encoded certificate string
* **callback** is a callback function with an error object and a boolean as arguments
-->

### Custom extensions config file

You can specify custom OpenSSL extensions using the `config` or `extFile` options for `createCertificate` (or using `csrConfigFile` with `createCSR`).

`extFile` and `csrConfigFile` should be paths to the extension files. While `config` will generate a temporary file from the supplied file contents.

If you specify `config` then the `v3_req` section of your config file will be used.

The following would be an example of a Certificate Authority extensions file:

    [req]
    req_extensions = v3_req
    distinguished_name = req_distinguished_name

    [req_distinguished_name]
    commonName = Common Name
    commonName_max = 64

    [v3_req]
    basicConstraints = critical,CA:TRUE

While the following would specify subjectAltNames in the resulting certificate:

    [req]
    req_extensions = v3_req

    [ v3_req ]
    basicConstraints = CA:FALSE
    keyUsage = nonRepudiation, digitalSignature, keyEncipherment
    subjectAltName = @alt_names

    [alt_names]
    DNS.1 = host1.example.com
    DNS.2 = host2.example.com
    DNS.3 = host3.example.com

Note that `createCertificate` and `createCSR` supports the `altNames` option which would be easier to use in most cases.

**Warning: If you specify `altNames` the custom extensions file will not be passed to OpenSSL.**

### Setting openssl location

In some systems the `openssl` executable might not be available by the default name or it is not included in $PATH. In this case you can define the location of the executable yourself as a one time action after you have loaded the pem module:

```javascript
var pem = require('pem')
pem.config({
  pathOpenSSL: '/usr/local/bin/openssl'
})
// do something with the pem module
```

### Specialthanks to

- Andris Reinman (@andris9) - Initiator of pem

## License

**MIT**
