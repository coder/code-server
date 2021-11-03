'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var $isNaN = require('../helpers/isNaN');
var padTimeComponent = require('../helpers/padTimeComponent');

var Type = require('./Type');
var WeekDay = require('./WeekDay');
var MonthFromTime = require('./MonthFromTime');
var YearFromTime = require('./YearFromTime');
var DateFromTime = require('./DateFromTime');

// https://262.ecma-international.org/9.0/#sec-datestring

module.exports = function DateString(tv) {
	if (Type(tv) !== 'Number' || $isNaN(tv)) {
		throw new $TypeError('Assertion failed: `tv` must be a non-NaN Number');
	}
	var weekday = weekdays[WeekDay(tv)];
	var month = months[MonthFromTime(tv)];
	var day = padTimeComponent(DateFromTime(tv));
	var year = padTimeComponent(YearFromTime(tv), 4);
	return weekday + '\x20' + month + '\x20' + day + '\x20' + year;
};
