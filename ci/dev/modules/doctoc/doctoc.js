#!/usr/bin/env node

'use strict';

var path      =  require('path')
  , fs        =  require('fs')
  , minimist  =  require('minimist')
  , file      =  require('./lib/file')
  , transform =  require('./lib/transform')
  , files;

function cleanPath(path) {
  var homeExpanded = (path.indexOf('~') === 0) ? process.env.HOME + path.substr(1) : path;

  // Escape all spaces
  return homeExpanded.replace(/\s/g, '\\ ');
}

function transformAndSave(files, mode, maxHeaderLevel, title, notitle, entryPrefix, processAll, stdOut, updateOnly) {
  if (processAll) {
    console.log('--all flag is enabled. Including headers before the TOC location.')
  }

  if (updateOnly) {
    console.log('--update-only flag is enabled. Only updating files that already have a TOC.')
  }
  
  console.log('\n==================\n');

  var transformed = files
    .map(function (x) {
      var content = fs.readFileSync(x.path, 'utf8')
        , result = transform(content, mode, maxHeaderLevel, title, notitle, entryPrefix, processAll, updateOnly);
      result.path = x.path;
      return result;
    });
  var changed = transformed.filter(function (x) { return x.transformed; })
    , unchanged = transformed.filter(function (x) { return !x.transformed; })
    , toc = transformed.filter(function (x) { return x.toc; })

  if (stdOut) {
    toc.forEach(function (x) {
      console.log(x.toc)
    })
  }

  unchanged.forEach(function (x) {
    console.log('"%s" is up to date', x.path);
  });

  changed.forEach(function (x) { 
    if (stdOut) {
      console.log('==================\n\n"%s" should be updated', x.path)
    } else {
      console.log('"%s" will be updated', x.path);
      fs.writeFileSync(x.path, x.data, 'utf8');
    }
  });
}

function printUsageAndExit(isErr) {

  var outputFunc = isErr ? console.error : console.info;

  outputFunc('Usage: doctoc [mode] [--entryprefix prefix] [--notitle | --title title] [--maxlevel level] [--all] [--update-only] <path> (where path is some path to a directory (e.g., .) or a file (e.g., README.md))');
  outputFunc('\nAvailable modes are:');
  for (var key in modes) {
    outputFunc('  --%s\t%s', key, modes[key]);
  }
  outputFunc('Defaults to \'' + mode + '\'.');

  process.exit(isErr ? 2 : 0);
}

var modes = {
    bitbucket : 'bitbucket.org'
  , nodejs    : 'nodejs.org'
  , github    : 'github.com'
  , gitlab    : 'gitlab.com'
  , ghost     : 'ghost.org'
}

var mode = modes['github'];

var argv = minimist(process.argv.slice(2)
    , { boolean: [ 'h', 'help', 'T', 'notitle', 's', 'stdout', 'all' , 'u', 'update-only'].concat(Object.keys(modes))
    , string: [ 'title', 't', 'maxlevel', 'm', 'entryprefix' ]
    , unknown: function(a) { return (a[0] == '-' ? (console.error('Unknown option(s): ' + a), printUsageAndExit(true)) : true); }
    });

if (argv.h || argv.help) {
  printUsageAndExit();
}

for (var key in modes) {
  if (argv[key]) {
    mode = modes[key];
  }
}

var title = argv.t || argv.title;
var notitle = argv.T || argv.notitle;
var entryPrefix = argv.entryprefix || '-';
var processAll = argv.all;
var stdOut = argv.s || argv.stdout
var updateOnly = argv.u || argv['update-only']

var maxHeaderLevel = argv.m || argv.maxlevel;
if (maxHeaderLevel && isNaN(maxHeaderLevel) || maxHeaderLevel < 0) { console.error('Max. heading level specified is not a positive number: ' + maxHeaderLevel), printUsageAndExit(true); }

for (var i = 0; i < argv._.length; i++) {
  var target = cleanPath(argv._[i])
    , stat = fs.statSync(target)

  if (stat.isDirectory()) {
    console.log ('\nDocToccing "%s" and its sub directories for %s.', target, mode);
    files = file.findMarkdownFiles(target);
  } else {
    console.log ('\nDocToccing single file "%s" for %s.', target, mode);
    files = [{ path: target }];
  }

  transformAndSave(files, mode, maxHeaderLevel, title, notitle, entryPrefix, processAll, stdOut, updateOnly);

  console.log('\nEverything is OK.');
}

module.exports.transform = transform;
