'use strict';

/**
 * Finds the start and end lines that match the given criteria.
 * Used by update-section itself.
 *
 * Use it if you need to get information about where the matching content is located.
 *
 * @name updateSection::parse
 * @function
 * @param {Array.<string>} lines the lines in which to look for matches
 * @param {Function} matchesStart when called with a line needs to return true iff it is the section start line
 * @param {Function} matchesEnd when called with a line needs to return true iff it is the section end line
 * @return {object} with the following properties: hasStart, hasEnd, startIdx, endIdx 
 */
function parse(lines, matchesStart, matchesEnd) {
  var startIdx = -1
    , endIdx = -1
    , hasStart = false
    , hasEnd = false
    , line;

  for (var i = 0; i < lines.length; i++) {
    line = lines[i]
    if (!hasStart && matchesStart(line)) { 
      startIdx = i;
      hasStart = true;
    } else if (!hasEnd && matchesEnd(line)) {
      endIdx = i;
      hasEnd = true;
    }
    if (hasStart && hasEnd) break;
  }

  // no end, correct it to be all remaining lines after start
  if (!hasEnd) {
    endIdx = lines.length;
    hasEnd = true;
  }

  return { hasStart: hasStart, hasEnd: hasEnd, startIdx: startIdx, endIdx: endIdx };
}

/**
 * Updates the content with the given section. 
 *
 * If previous section is found it is replaced.
 * Otherwise the section is appended to the end of the content.
 *
 * @name updateSection
 * @function
 * @param {String} content that may or may not include a previously added section
 * @param {String} section the section to update
 * @param {Function} matchesStart when called with a line needs to return true iff it is the section start line
 * @param {Function} matchesEnd when called with a line needs to return true iff it is the section end line
 * @param {boolean} top forces the section to be added at the top of the content if a replacement couldn't be made
 * @return {String} content with updated section
 */
exports = module.exports = function updateSection(content, section, matchesStart, matchesEnd, top) {
  if (!content) return section;

  var lines = content.split('\n')
  if (!lines.length) return section;

  var info = parse(lines, matchesStart, matchesEnd);

  // no previous section found in content not just append
  if (!info.hasStart) return top ? section + '\n\n' + content : content + '\n\n' + section;

  var sectionLines = section.split('\n')
    , dropN = info.endIdx - info.startIdx + 1;

  [].splice.apply(lines, [ info.startIdx, dropN ].concat(sectionLines))

  return lines.join('\n');
}

exports.parse = parse;
