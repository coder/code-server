var debug;
try {
  /* eslint global-require: off */
  debug = require("debug")("follow-redirects");
}
catch (error) {
  debug = function () { /* */ };
}
module.exports = debug;
