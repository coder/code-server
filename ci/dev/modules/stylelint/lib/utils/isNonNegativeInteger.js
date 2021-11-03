'use strict';

// TODO: We need this polyfill because of the support of Node 10.
//       When we will drop Node 10, please remove this polyfill.
//       See <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger>
const isInteger =
	Number.isInteger ||
	function (value) {
		return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
	};

/**
 * @param {unknown} value
 */
module.exports = function (value) {
	return isInteger(value) && typeof value === 'number' && value >= 0;
};
