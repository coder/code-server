module.exports = function (buf) {
    return Buffer.isBuffer(buf);
};
module.exports.a = function () {
    return Buffer.from('abcd', 'hex');
};
