'use strict';

var _             = require('underscore')
  , anchor        = require('anchor-markdown-header')
  , updateSection = require('update-section')
  , getHtmlHeaders = require('./get-html-headers')
  , md            = require('@textlint/markdown-to-ast');

var start = '<!-- START doctoc generated TOC please keep comment here to allow auto update -->\n' +
            '<!-- DON\'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->'
  , end   = '<!-- END doctoc generated TOC please keep comment here to allow auto update -->'

function matchesStart(line) {
  return (/<!-- START doctoc /).test(line);
}

function matchesEnd(line) {
  return (/<!-- END doctoc /).test(line);
}

function notNull(x) { return  x !== null; }

function addAnchor(mode, header) {
  header.anchor = anchor(header.name, mode, header.instance);
  return header;
}

function isString(y) {
  return typeof y === 'string';
}


function getMarkdownHeaders (lines, maxHeaderLevel) {
  function extractText (header) {
    return header.children
      .map(function (x) {
        if (x.type === md.Syntax.Link) {
          return extractText(x);
        }
        else if (x.type === md.Syntax.Image) {
          // Images (at least on GitHub, untested elsewhere) are given a hyphen
          // in the slug. We can achieve this behavior by adding an '*' to the
          // TOC entry. Think of it as a "magic char" that represents the iamge.
          return '*';
        }
        else {
          return x.raw;
        }
      })
      .join('')
  }

  return md.parse(lines.join('\n')).children
    .filter(function (x) {
      return x.type === md.Syntax.Header;
    })
    .map(function (x) {
      return !maxHeaderLevel || x.depth <= maxHeaderLevel
        ? { rank :  x.depth
          , name :  extractText(x)
          , line :  x.loc.start.line
          }
        : null;
    })
    .filter(notNull)
}

function countHeaders (headers) {
  var instances = {};

  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    var name = header.name;

    if (Object.prototype.hasOwnProperty.call(instances, name)) {
      // `instances.hasOwnProperty(name)` fails when there’s an instance named "hasOwnProperty".
      instances[name]++;
    } else {
      instances[name] = 0;
    }

    header.instance = instances[name];
  }

  return headers;
}

function getLinesToToc (lines, currentToc, info, processAll) {
  if (processAll || !currentToc) return lines;

  var tocableStart = 0;

  // when updating an existing toc, we only take the headers into account
  // that are below the existing toc
  if (info.hasEnd) tocableStart = info.endIdx + 1;

  return lines.slice(tocableStart);
}

// Use document context as well as command line args to infer the title
function determineTitle(title, notitle, lines, info) {
  var defaultTitle = '**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*';

  if (notitle) return '';
  if (title) return title;
  return info.hasStart ? lines[info.startIdx + 2] : defaultTitle;
}

exports = module.exports = function transform(content, mode, maxHeaderLevel, title, notitle, entryPrefix, processAll, updateOnly) {
  mode = mode || 'github.com';
  entryPrefix = entryPrefix || '-';

  // only limit *HTML* headings by default
  var maxHeaderLevelHtml = maxHeaderLevel || 4;

  var lines = content.split('\n')
    , info = updateSection.parse(lines, matchesStart, matchesEnd)

  if (!info.hasStart && updateOnly) {
    return { transformed: false };
  }

  var inferredTitle = determineTitle(title, notitle, lines, info);

  var titleSeparator = inferredTitle ? '\n\n' : '\n';

  var currentToc = info.hasStart && lines.slice(info.startIdx, info.endIdx + 1).join('\n')
    , linesToToc = getLinesToToc(lines, currentToc, info, processAll);

  var headers = getMarkdownHeaders(linesToToc, maxHeaderLevel)
    .concat(getHtmlHeaders(linesToToc, maxHeaderLevelHtml))

  headers.sort(function (a, b) {
    return a.line - b.line;
  });

  var allHeaders    =  countHeaders(headers)
    , lowestRank    =  _(allHeaders).chain().pluck('rank').min().value()
    , linkedHeaders =  _(allHeaders).map(addAnchor.bind(null, mode));

  if (linkedHeaders.length === 0) return { transformed: false };

  // 4 spaces required for proper indention on Bitbucket and GitLab
  var indentation = (mode === 'bitbucket.org' || mode === 'gitlab.com') ? '    ' : '  ';

  var toc =
      inferredTitle
    + titleSeparator
    + linkedHeaders
        .map(function (x) {
          var indent = _(_.range(x.rank - lowestRank))
            .reduce(function (acc, x) { return acc + indentation; }, '');

          return indent + entryPrefix + ' ' + x.anchor;
        })
        .join('\n')
    + '\n';

  var wrappedToc =  start + '\n' + toc + '\n' + end;

  if (currentToc === toc) return { transformed: false };

  var data = updateSection(lines.join('\n'), wrappedToc, matchesStart, matchesEnd, true);
  return { transformed : true, data : data, toc: toc, wrappedToc: wrappedToc };
};

exports.start = start;
exports.end = end;
