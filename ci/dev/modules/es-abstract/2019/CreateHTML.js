'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var callBound = require('call-bind/callBound');

var $replace = callBound('String.prototype.replace');

var RequireObjectCoercible = require('./RequireObjectCoercible');
var ToString = require('./ToString');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-createhtml

module.exports = function CreateHTML(string, tag, attribute, value) {
	if (Type(tag) !== 'String' || Type(attribute) !== 'String') {
		throw new $TypeError('Assertion failed: `tag` and `attribute` must be strings');
	}
	var str = RequireObjectCoercible(string);
	var S = ToString(str);
	var p1 = '<' + tag;
	if (attribute !== '') {
		var V = ToString(value);
		var escapedV = $replace(V, /\x22/g, '&quot;');
		p1 += '\x20' + attribute + '\x3D\x22' + escapedV + '\x22';
	}
	return p1 + '>' + S + '</' + tag + '>';
};
