'use strict';

/**
 * Check whether a media feature is a range context one
 *
 * @param {string} mediaFeature feature
 * @return {boolean} If `true`, media feature is a range context one
 */
module.exports = function (mediaFeature) {
	return mediaFeature.includes('=') || mediaFeature.includes('<') || mediaFeature.includes('>');
};
