"use strict";
const path_1 = require("path");
/**
 * File URI to Path function.
 *
 * @param {String} uri
 * @return {String} path
 * @api public
 */
function fileUriToPath(uri) {
    if (typeof uri !== 'string' ||
        uri.length <= 7 ||
        uri.substring(0, 7) !== 'file://') {
        throw new TypeError('must pass in a file:// URI to convert to a file path');
    }
    const rest = decodeURI(uri.substring(7));
    const firstSlash = rest.indexOf('/');
    let host = rest.substring(0, firstSlash);
    let path = rest.substring(firstSlash + 1);
    // 2.  Scheme Definition
    // As a special case, <host> can be the string "localhost" or the empty
    // string; this is interpreted as "the machine from which the URL is
    // being interpreted".
    if (host === 'localhost') {
        host = '';
    }
    if (host) {
        host = path_1.sep + path_1.sep + host;
    }
    // 3.2  Drives, drive letters, mount points, file system root
    // Drive letters are mapped into the top of a file URI in various ways,
    // depending on the implementation; some applications substitute
    // vertical bar ("|") for the colon after the drive letter, yielding
    // "file:///c|/tmp/test.txt".  In some cases, the colon is left
    // unchanged, as in "file:///c:/tmp/test.txt".  In other cases, the
    // colon is simply omitted, as in "file:///c/tmp/test.txt".
    path = path.replace(/^(.+)\|/, '$1:');
    // for Windows, we need to invert the path separators from what a URI uses
    if (path_1.sep === '\\') {
        path = path.replace(/\//g, '\\');
    }
    if (/^.+:/.test(path)) {
        // has Windows drive at beginning of path
    }
    else {
        // unix path…
        path = path_1.sep + path;
    }
    return host + path;
}
module.exports = fileUriToPath;
//# sourceMappingURL=index.js.map