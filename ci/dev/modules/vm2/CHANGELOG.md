v3.9.2 (2020-04-29)
-------------------
[new] Added NodeVM options to pass argv & env to process object (XmiliaH)
[fix] Fixed breakouts in NodeVM (XmiliaH)
[fix] Made async check more robust (XmiliaH)

v3.9.1 (2020-03-29)
-------------------
[fix] Require helpers statically in main (XmiliaH)
[fix] Fix for non-configurable property access (XmiliaH)

v3.9.0 (2020-03-21)
-------------------
[new] Added vm.Script `lineOffset` and `columnOffset` options (azu)
[new] Allow to specify a compiler per VMScript (XmiliaH)
[new] Add option to disable async (XmiliaH)
[new] Added allot of jsdoc (XmiliaH)
[fix] Fix access to frozen or unconfigurable properties (XmiliaH)
[fix] Double wrap Objects to prevent breakout via inspect (XmiliaH)
[fix] Compile now compiles VM code (XmiliaH)

v3.8.4 (2019-09-13)
-------------------
[fix] Do not allow precompiling VMScript (XmiliaH)
[fix] Security fixes (XmiliaH)

v3.8.3 (2019-07-31)
-------------------
[fix] Security fixes

v3.8.2 (2019-06-13)
-------------------
[fix] toString() on builtin objects

v3.8.1 (2019-05-02)
-------------------
[fix] Module resolver fixes
[fix] require('events') works correctly in Node 12
[fix] SyntaxError not being instanceOf Error

v3.8.0 (2019-04-21)
-------------------
[new] Allow prohibiting access to eval/wasm in sandbox context
[new] Allow transitive external dependencies in sandbox context (Idan Attias)
[new] Allow using wildcards in module-names passed using the external attribute (Harel Moshe)
[fix] Default to index.js when specified "main" does not exist (Harel Moshe)
[fix] Security fixes

v3.7.0 (2019-04-15)
-------------------
[new] Add require.resolve (Idan Attias)
[new] Support multiple root paths (Idan Attias)

v3.6.11 (2019-04-08)
-------------------
[fix] Contextification of EvalError and URIError
[fix] Security fixes

v3.6.10 (2019-01-28)
-------------------
[fix] Add missing console.debug function in NodeVM
[fix] Security fixes

v3.6.9 (2019-01-26)
-------------------
[fix] Security fixes

v3.6.8 (2019-01-26)
-------------------
[fix] Security fixes

v3.6.7 (2019-01-26)
-------------------
[fix] Security fixes

v3.6.6 (2019-01-01)
-------------------
[fix] Security fixes

v3.6.5 (2018-12-31)
-------------------
[fix] Security fixes

v3.6.4 (2018-10-17)
-------------------
[fix] Added new to vmwerror when trying to load coffeescipt but can't (dotconnor)
[fix] Add arguments to process.nextTick proxy (Patrick Engström)

v3.6.3 (2018-08-06)
-------------------
[fix] Security fixes

v3.6.2 (2018-07-05)
-------------------
[fix] Security fixes

v3.6.1 (2018-06-27)
-------------------
[fix] Security fixes

v3.6.0 (2018-05-11)
-------------------
[new] Support for custom source extensions
[new] WIP support for disallowing Promise
[fix] Prevent slow unsafe alloc for Buffers
[fix] Refactors around defaults
[fix] Types definition update

v3.5.2 (2017-10-04)
-------------------
[fix] Prevent slow unsafe alloc for Buffers

v3.5.1 (2017-10-04)
-------------------
[fix] Prevent unsafe alloc for Buffers

v3.5.0 (2017-08-31)
-------------------
[new] Allow a custom compiler to recieve the filetype (Orta Therox)
[new] Allow in-sandbox requires to also get called through the compiler (Orta Therox)
[new] Support whitelisting modules inside a VM (Orta Therox)
[new] Add TypeScript definition (Orta Therox)

v3.4.0 (2017-03-28)
-------------------
[new] Added experimental VM.protect method

v3.3.1 (2017-03-27)
-------------------
[new] Added VM.freeze method

v3.2.0 (2017-02-10)
-------------------
[new] Added support for pre-compiled scripts via VMScript

v3.1.0 (2016-09-03)
-------------------
[new] Added option wrapper (Alizain Feerasta)

v3.0.1 (2016-07-20)
-------------------
Initial release
