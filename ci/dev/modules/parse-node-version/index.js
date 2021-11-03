'use strict';

function parseNodeVersion(version) {
  var match = version.match(/^v(\d{1,2})\.(\d{1,2})\.(\d{1,2})(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/); // eslint-disable-line max-len
  if (!match) {
    throw new Error('Unable to parse: ' + version);
  }

  var res = {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    pre: match[4] || '',
    build: match[5] || '',
  };

  return res;
}

module.exports = parseNodeVersion;
