'use strict';

/* globals lockdown */
require('ses');

lockdown({ errorTaming: 'unsafe' });

require('.');
