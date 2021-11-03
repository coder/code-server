'use strict';
/*jshint asi: true */

var test = require('tape')
  , updateSection = require('../')

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

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

test('\nstart and end', function (t) {
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
    , '#The End'
    , ''
    , 'Til next time'
  ].join('\n');

  var expected = [ 
    '# Some Project',
    '',
    'Does a bunch of things',
    '',
    'START -- GENERATED GOODNESS',
    'this was painstakingly re-generated',
    'and we added another line',
    'here',
    'END -- GENERATED GOODNESS',
    '',
    '#The End',
    '',
    'Til next time' ];

  var updated = updateSection(original, update, matchesStart, matchesEnd);

  t.deepEqual(expected, updated.split('\n'), 'replaces in between start and end')

  t.end()
})

test('\nstart only', function (t) {
  var original = [
      '# Some Project'
    , ''
    , 'Does a bunch of things'
    , ''
    , 'START -- GENERATED GOODNESS'
    , 'this was painstakingly generated'
    , 'as was this'
    , ''
    , '#The End'
    , ''
    , 'Til next time'
  ].join('\n');

  var expected = [
   '# Some Project',
    '',
    'Does a bunch of things',
    '',
    'START -- GENERATED GOODNESS',
    'this was painstakingly re-generated',
    'and we added another line',
    'here',
    'END -- GENERATED GOODNESS' ];

  var updated = updateSection(original, update, matchesStart, matchesEnd);

  t.deepEqual(expected, updated.split('\n'), 'replaces until end of file')
  t.end()
})

test('\nend only', function (t) {
  var original = [
      '# Some Project'
    , ''
    , 'Does a bunch of things'
    , ''
    , 'this was painstakingly generated'
    , 'as was this'
    , ''
    , 'END -- GENERATED GOODNESS'
    , '#The End'
    , ''
    , 'Til next time'
  ].join('\n');

  var expected = [ 
    '# Some Project',
    '',
    'Does a bunch of things',
    '',
    'this was painstakingly generated',
    'as was this',
    '',
    'END -- GENERATED GOODNESS',
    '#The End',
    '',
    'Til next time',
    '',
    'START -- GENERATED GOODNESS',
    'this was painstakingly re-generated',
    'and we added another line',
    'here',
    'END -- GENERATED GOODNESS'];

  var updated = updateSection(original, update, matchesStart, matchesEnd);

  t.deepEqual(expected, updated.split('\n'), 'adds update to end of file and keeps old section')
  t.end()
})

test('\nno start or end', function (t) {
  var original = [
      '# Some Project'
    , ''
    , 'Does a bunch of things'
    , ''
    , '#The End'
    , ''
    , 'Til next time'
  ].join('\n');

  var expected = [ 
    '# Some Project',
    '',
    'Does a bunch of things',
    '',
    '#The End',
    '',
    'Til next time',
    '',
    'START -- GENERATED GOODNESS',
    'this was painstakingly re-generated',
    'and we added another line',
    'here',
    'END -- GENERATED GOODNESS' ];

  var updated = updateSection(original, update, matchesStart, matchesEnd);

  t.deepEqual(expected, updated.split('\n'))
  t.end()
})

test('\nno start or end force top', function (t) {
  var original = [
      '# Some Project'
    , ''
    , 'Does a bunch of things'
    , ''
    , '#The End'
    , ''
    , 'Til next time'
  ].join('\n');

  var expected = [ 
    'START -- GENERATED GOODNESS',
    'this was painstakingly re-generated',
    'and we added another line',
    'here',
    'END -- GENERATED GOODNESS',
    '',
    '# Some Project',
    '',
    'Does a bunch of things',
    '',
    '#The End',
    '',
    'Til next time']

  var updated = updateSection(original, update, matchesStart, matchesEnd, true);

  t.deepEqual(expected, updated.split('\n'))
  t.end()
})

test('\nempty string', function (t) {
  var original = '';
  var updated = updateSection(original, update, matchesStart, matchesEnd);

  t.equal(update, updated, 'returns section only')
  t.end()
})
