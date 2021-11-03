// Type definitions for PEM 1.9
// Project: https://github.com/dexus/pem
// Definitions by: Anthony Trinh <https://github.com/tony19>, Ruslan Arkhipau <https://github.com/DethAriel>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
/// <reference types="node" />

export interface ModuleConfiguration {
    /**
     * Path to OpenSSL binaries
     */
    pathOpenSSL: string;
}

export type PrivateKeyCipher = "aes128" | "aes192" | "aes256" | "camellia128" | "camellia192" | "camellia256" | "des" | "des3" | "idea" | string; // allow for additions in future

export interface PrivateKeyCreationOptions {
    cipher: PrivateKeyCipher;
    password: string;
}

export interface Pkcs12CreationOptions {
    cipher?: PrivateKeyCipher | undefined;
    clientKeyPassword?: string | undefined;
    certFiles?: string[] | undefined;
}

export interface Pkcs12ReadOptions {
    p12Password?: string | undefined;
    clientKeyPassword?: string | undefined;
}

export type HashFunction = 'md5' | 'sha1' | 'sha256' | string;
export interface CSRCreationOptions {
    /**
     *  Optional client key to use
     */
    clientKey?: string | undefined;
    clientKeyPassword?: string | undefined;
    /**
     * If clientKey is undefined, bit size to use for generating a new key (defaults to 2048)
     */
    keyBitsize?: number | undefined;
    /**
     * Hash function to use, defaults to sha256
     */
    hash?: HashFunction | undefined;
    /**
     * CSR country field
     */
    country?: string | undefined;
    /**
     * CSR state field
     */
    state?: string | undefined;
    /**
     * CSR locality field
     */
    locality?: string | undefined;
    /**
     * CSR organization field
     */
    organization?: string | undefined;
    /**
     * CSR organizational unit field
     */
    organizationUnit?: string | undefined;
    /**
     * CSR common name field, defaults to 'localhost'
     */
    commonName?: string | undefined;
    /**
     * CSR email address field
     */
    emailAddress?: string | undefined;
    /**
     * CSR config file
     */
    csrConfigFile?: string | undefined;
    /**
     * A list of subjectAltNames in the subjectAltName field
     */
    altNames?: string[] | undefined;
}

export interface CertificateCreationOptions extends CSRCreationOptions {
    /**
     * Private key for signing the certificate, if not defined a new one is generated
     */
    serviceKey?: string | undefined;
    /**
     * Password of the service key
     */
    serviceKeyPassword?: string | undefined;
    serviceCertificate?: any;
    serial?: any;
    /**
     * If set to true and serviceKey is not defined, use clientKey for signing
     */
    selfSigned?: boolean | undefined;
    /**
     * CSR for the certificate, if not defined a new one is generated from the provided parameters
     */
    csr?: string | undefined;
    /**
     * Certificate expire time in days, defaults to 365
     */
    days?: number | undefined;
    /**
     * Password of the client key
     */
    clientKeyPassword?: string | undefined;
    /**
     * extension config file - without '-extensions v3_req'
     */
    extFile?: string | undefined;
    /**
     * extension config file - with '-extensions v3_req'
     */
    config?: string | undefined;
}

export interface CertificateCreationResult {
    certificate: any;
    csr: string;
    clientKey: string;
    serviceKey: string;
}

export interface CertificateSubjectReadResult {
    country: string;
    state: string;
    locality: string;
    organization: string;
    organizationUnit: string;
    commonName: string;
    emailAddress: string;
}

export interface Pkcs12ReadResult {
    key: string;
    cert: string;
    ca: string[];
}

export type Callback<T> = (error: any, result: T) => any;

/**
 * Creates a private key
 *
 * @param [keyBitsize=2048] Size of the key, defaults to 2048bit (can also be a function)
 * @param [options] private key encryption settings, defaults to empty object (no enryption)
 * @param callback Callback function with an error object and {key}
 */
export function createPrivateKey(keyBitsize: number, options: PrivateKeyCreationOptions, callback: Callback<{ key: string }>): void;
export function createPrivateKey(optionsOrKeyBitsize: number | PrivateKeyCreationOptions, callback: Callback<{ key: string }>): void;
export function createPrivateKey(callback: Callback<{ key: string }>): void;

/**
 * Creates a dhparam key
 *
 * @param [keyBitsize=512] Size of the key, defaults to 512bit
 * @param callback Callback function with an error object and {dhparam}
 */
export function createDhparam(keyBitsize: number, callback: Callback<{ dhparam: any }>): void;
export function createDhparam(callback: Callback<{ dhparam: any }>): void;

/**
 * Creates a Certificate Signing Request
 *
 * If options.clientKey is undefined, a new key is created automatically. The used key is included
 * in the callback return as clientKey
 *
 * @param  [options] Optional options object
 * @param callback Callback function with an error object and {csr, clientKey}
 */
export function createCSR(options: CSRCreationOptions, callback: Callback<{ csr: string, clientKey: string }>): void;
export function createCSR(callback: Callback<{ csr: string, clientKey: string }>): void;

/**
 * Creates a certificate based on a CSR. If CSR is not defined, a new one
 * will be generated automatically. For CSR generation all the options values
 * can be used as with createCSR.
 *
 * @param [CertificateCreationOptions] Optional options object
 * @param callback Callback function with an error object and {certificate, csr, clientKey, serviceKey}
 */
export function createCertificate(options: CertificateCreationOptions, callback: Callback<CertificateCreationResult>): void;
export function createCertificate(callback: Callback<CertificateCreationResult>): void;

/**
 * Reads subject data from a certificate or a CSR
 *
 * @param certificate PEM encoded CSR or certificate
 * @param callback Callback function with an error object and {country, state, locality, organization, organizationUnit, commonName, emailAddress}
 */
export function readCertificateInfo(certificate: string, callback: Callback<CertificateSubjectReadResult>): void;
export function readCertificateInfo(callback: Callback<CertificateSubjectReadResult>): void;

/**
 * Exports a public key from a private key, CSR or certificate
 *
 * @param certificate PEM encoded private key, CSR or certificate
 * @param callback Callback function with an error object and {publicKey}
 */
export function getPublicKey(certificate: string, callback: Callback<{ publicKey: string }>): void;
export function getPublicKey(callback: Callback<{ publicKey: string }>): void;

/**
 * Gets the fingerprint for a certificate
 *
 * @param certificate PEM encoded certificate
 * @param hash Hash function to use (either md5 sha1 or sha256, defaults to sha256)
 * @param callback Callback function with an error object and {fingerprint}
 */
export function getFingerprint(certificate: string, hash: HashFunction, callback: Callback<{ fingerprint: string }>): void;
export function getFingerprint(certificate: string, callback: Callback<{ fingerprint: string }>): void;
export function getFingerprint(callback: Callback<{ fingerprint: string }>): void;

/**
 * Gets the modulus from a certificate, a CSR or a private key
 *
 * @param certificate PEM encoded, CSR PEM encoded, or private key
 * @param password password for the certificate
 * @param callback Callback function with an error object and {modulus}
 */
export function getModulus(certificate: string, password: string, callback: Callback<{ modulus: any }>): void;
export function getModulus(certificate: string, callback: Callback<{ modulus: any }>): void;

/**
 * Gets the size and prime of DH parameters
 *
 * @param dh DH parameters PEM encoded
 * @param callback Callback function with an error object and {size, prime}
 */
export function getDhparamInfo(dh: string, callback: Callback<{ size: any, prime: any }>): void;

/**
 * Exports private key and certificate to a PKCS12 keystore
 *
 * @param key PEM encoded private key
 * @param certificate PEM encoded certificate
 * @param password Password of the result PKCS12 file
 * @param [options] object of cipher and optional client key password {cipher:'aes128', clientKeyPassword: 'xxx'}
 * @param callback Callback function with an error object and {pkcs12}
 */
export function createPkcs12(key: string, certificate: string, password: string, options: Pkcs12CreationOptions, callback: Callback<{ pkcs12: any }>): void;
export function createPkcs12(key: string, certificate: string, password: string, callback: Callback<{ pkcs12: any }>): void;

/**
 * Reads private key and certificate from a PKCS12 keystore
 * @param callback Callback function with an error object and {pkcs12}
 * @returns the result of the callback
 */
export function readPkcs12(bufferOrPath: Buffer | string, options: Pkcs12ReadOptions, callback: Callback<Pkcs12ReadResult>): any;
export function readPkcs12(bufferOrPath: Buffer | string, callback: Callback<Pkcs12ReadResult>): any;

/**
 * Verifies the signing chain of the passed certificate
 *
 * @param certificate PEM encoded certificate
 * @param ca List of CA certificates
 * @param callback Callback function with an error object and a boolean valid
 */
export function verifySigningChain(certificate: string, ca: string[], callback: Callback<boolean>): void;

/**
 * config the pem module
 */
export function config(options: ModuleConfiguration): void;
