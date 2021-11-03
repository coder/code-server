'use strict';

var updateSection = require('../')

var original = [
    '# Some Project'
  , ''
  , 'Does a bunch of things'
  , ''
  , 'START -- GENERATED GOODNESS'
  , 'this was painstakingly generated'
  , 'as was this'
  , 'END -- GENERATED GOODNESS'
  , ''
  , '## The End'
  , ''
  , 'Til next time'
].join('\n');

var update = [
    'START -- GENERATED GOODNESS'
  , 'this was painstakingly re-generated'
  , 'and we added another line'
  , 'here'
  , 'END -- GENERATED GOODNESS'
].join('\n');

function matchesStart(line) {
  return (/START -- GENERATED GOODNESS/).test(line);  
}

function matchesEnd(line) {
  return (/END -- GENERATED GOODNESS/).test(line);  
}

var updated = updateSection(original, update, matchesStart, matchesEnd);
console.log(updated);
