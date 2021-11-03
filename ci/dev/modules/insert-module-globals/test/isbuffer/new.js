module.exports = function (buf) {
    return Buffer.isBuffer(buf);
};
module.exports.a = function () {
    return new Buffer('abcd');
};
