var Parser = require('../lib/parser'),
    parseListEntry = Parser.parseListEntry;

var path = require('path'),
    assert = require('assert'),
    inspect = require('util').inspect;

var group = path.basename(__filename, '.js') + '/';

[
  { source: 'drwxr-xr-x  10 root   root    4096 Dec 21  2012 usr',
    expected: {
      type: 'd',
      name: 'usr',
      target: undefined,
      sticky: false,
      rights: { user: 'rwx', group: 'rx', other: 'rx' },
      acl: false,
      owner: 'root',
      group: 'root',
      size: 4096,
      date: new Date('2012-12-21T00:00')
    },
    what: 'Normal directory'
  },
  { source: 'drwxrwxrwx   1 owner   group          0 Aug 31 2012 e-books',
    expected: {
      type: 'd',
      name: 'e-books',
      target: undefined,
      sticky: false,
      rights: { user: 'rwx', group: 'rwx', other: 'rwx' },
      acl: false,
      owner: 'owner',
      group: 'group',
      size: 0,
      date: new Date('2012-08-31T00:00')
    },
    what: 'Normal directory #2'
  },
  { source: '-rw-rw-rw-   1 owner   group    7045120 Sep 02  2012 music.mp3',
    expected: {
      type: '-',
      name: 'music.mp3',
      target: undefined,
      sticky: false,
      rights: { user: 'rw', group: 'rw', other: 'rw' },
      acl: false,
      owner: 'owner',
      group: 'group',
      size: 7045120,
      date: new Date('2012-09-02T00:00')
    },
    what: 'Normal file'
  },
  { source: '-rw-rw-rw-+   1 owner   group    7045120 Sep 02  2012 music.mp3',
    expected: {
      type: '-',
      name: 'music.mp3',
      target: undefined,
      sticky: false,
      rights: { user: 'rw', group: 'rw', other: 'rw' },
      acl: true,
      owner: 'owner',
      group: 'group',
      size: 7045120,
      date: new Date('2012-09-02T00:00')
    },
    what: 'File with ACL set'
  },
  { source: 'drwxrwxrwt   7 root   root    4096 May 19 2012 tmp',
    expected: {
      type: 'd',
      name: 'tmp',
      target: undefined,
      sticky: true,
      rights: { user: 'rwx', group: 'rwx', other: 'rwx' },
      acl: false,
      owner: 'root',
      group: 'root',
      size: 4096,
      date: new Date('2012-05-19T00:00')
    },
    what: 'Directory with sticky bit and executable for others'
  },
  { source: 'drwxrwx--t   7 root   root    4096 May 19 2012 tmp',
    expected: {
      type: 'd',
      name: 'tmp',
      target: undefined,
      sticky: true,
      rights: { user: 'rwx', group: 'rwx', other: 'x' },
      acl: false,
      owner: 'root',
      group: 'root',
      size: 4096,
      date: new Date('2012-05-19T00:00')
    },
    what: 'Directory with sticky bit and executable for others #2'
  },
  { source: 'drwxrwxrwT   7 root   root    4096 May 19 2012 tmp',
    expected: {
      type: 'd',
      name: 'tmp',
      target: undefined,
      sticky: true,
      rights: { user: 'rwx', group: 'rwx', other: 'rw' },
      acl: false,
      owner: 'root',
      group: 'root',
      size: 4096,
      date: new Date('2012-05-19T00:00')
    },
    what: 'Directory with sticky bit and not executable for others'
  },
  { source: 'drwxrwx--T   7 root   root    4096 May 19 2012 tmp',
    expected: {
      type: 'd',
      name: 'tmp',
      target: undefined,
      sticky: true,
      rights: { user: 'rwx', group: 'rwx', other: '' },
      acl: false,
      owner: 'root',
      group: 'root',
      size: 4096,
      date: new Date('2012-05-19T00:00')
    },
    what: 'Directory with sticky bit and not executable for others #2'
  },
  { source: 'total 871',
    expected: null,
    what: 'Ignored line'
  },
].forEach(function(v) {
  var result = parseListEntry(v.source),
      msg = '[' + group + v.what + ']: parsed output mismatch.\n'
            + 'Saw: ' + inspect(result) + '\n'
            + 'Expected: ' + inspect(v.expected);
  assert.deepEqual(result, v.expected, msg);
});
