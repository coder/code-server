'use strict';

const punctuationSets = {};

punctuationSets.mediaFeaturePunctuation = new Set([':', '=', '>', '>=', '<', '<=']);

punctuationSets.nonSpaceCombinators = new Set(['>', '+', '~', '>>>', '/deep/']);

module.exports = punctuationSets;
