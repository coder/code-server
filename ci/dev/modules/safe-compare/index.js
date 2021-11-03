/**
 * @author Michael Raith
 * @date   24.02.2016 12:04
 */

'use strict';

var crypto = require('crypto');
var bufferAlloc = require('buffer-alloc');


/**
 * Do a constant time string comparison. Always compare the complete strings
 * against each other to get a constant time. This method does not short-cut
 * if the two string's length differs.
 *
 * @param {string} a
 * @param {string} b
 *
 * @return {boolean}
 */
var safeCompare = function safeCompare(a, b) {
    var strA = String(a);
    var strB = String(b);
    var lenA = strA.length;
    var result = 0;

    if (lenA !== strB.length) {
        strB = strA;
        result = 1;
    }

    for (var i = 0; i < lenA; i++) {
        result |= (strA.charCodeAt(i) ^ strB.charCodeAt(i));
    }

    return result === 0;
};


/**
 * Call native "crypto.timingSafeEqual" methods.
 * All passed values will be converted into strings first.
 *
 * Runtime is always corresponding to the length of the first parameter (string
 * a).
 *
 * @param {string} a
 * @param {string} b
 *
 * @return {boolean}
 */
var nativeTimingSafeEqual = function nativeTimingSafeEqual(a, b) {
    var strA = String(a);
    var strB = String(b);
    var aLen = Buffer.byteLength(strA);
    var bLen = Buffer.byteLength(strB);

    // Always use length of a to avoid leaking the length. Even if this is a
    // false positive because one is a prefix of the other, the explicit length
    // check at the end will catch that.
    var bufA = bufferAlloc(aLen, 0, 'utf8');
    bufA.write(strA);
    var bufB = bufferAlloc(aLen, 0, 'utf8');
    bufB.write(strB);

    return crypto.timingSafeEqual(bufA, bufB) && aLen === bLen;
};


module.exports = (
    typeof crypto.timingSafeEqual !== 'undefined' ?
        nativeTimingSafeEqual :
        safeCompare
);
