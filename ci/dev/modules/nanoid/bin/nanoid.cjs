#!/usr/bin/env node

let { nanoid } = require('..')

process.stdout.write(nanoid() + '\n')
