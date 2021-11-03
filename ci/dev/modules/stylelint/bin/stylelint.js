#!/usr/bin/env node

'use strict';

// to use V8's code cache to speed up instantiation time
require('v8-compile-cache');

require('../lib/cli')(process.argv.slice(2));
