'use strict';

var GetIntrinsic = require('../../GetIntrinsic');

var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function defineProperty(O, P, Desc) {
	if ($defineProperty) {
		return $defineProperty(O, P, Desc);
	}
	if ((Desc.enumerable && Desc.configurable && Desc.writable) || !(P in O)) {
		O[P] = Desc.value; // eslint-disable-line no-param-reassign
		return O;
	}

	throw new SyntaxError('helper does not yet support this configuration');
};
module.exports.oDP = $defineProperty;
