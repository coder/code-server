# Nano ID

<img src="https://ai.github.io/nanoid/logo.svg" align="right"
     alt="Nano ID logo by Anton Lovchikov" width="180" height="94">

A tiny, secure, URL-friendly, unique string ID generator for JavaScript.

> “An amazing level of senseless perfectionism,
> which is simply impossible not to respect.”

* **Small.** 108 bytes (minified and gzipped). No dependencies.
  [Size Limit] controls the size.
* **Fast.** It is 60% faster than UUID.
* **Safe.** It uses cryptographically strong random APIs.
  Can be used in clusters.
* **Compact.** It uses a larger alphabet than UUID (`A-Za-z0-9_-`).
  So ID size was reduced from 36 to 21 symbols.
* **Portable.** Nano ID was ported
  to [14 programming languages](#other-programming-languages).

```js
import { nanoid } from 'nanoid'
model.id = nanoid() //=> "V1StGXR8_Z5jdHi6B-myT"
```

Supports modern browsers, IE [with Babel], Node.js and React Native.

[online tool]: https://gitpod.io/#https://github.com/ai/nanoid/
[with Babel]:  https://developer.epages.com/blog/coding/how-to-transpile-node-modules-with-babel-and-webpack-in-a-monorepo/
[Size Limit]:  https://github.com/ai/size-limit

<a href="https://evilmartians.com/?utm_source=nanoid">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>

## Table of Contents

* [Comparison with UUID](#comparison-with-uuid)
* [Benchmark](#benchmark)
* [Tools](#tools)
* [Security](#security)
* [Usage](#usage)
  * [JS](#js)
  * [IE](#ie)
  * [React](#react)
  * [Create React App](#create-react-app)
  * [React Native](#react-native)
  * [Rollup](#rollup)
  * [PouchDB and CouchDB](#pouchdb-and-couchdb)
  * [Mongoose](#mongoose)
  * [ES Modules](#es-modules)
  * [Web Workers](#web-workers)
  * [CLI](#cli)
  * [Other Programming Languages](#other-programming-languages)
* [API](#api)
  * [Async](#async)
  * [Non-Secure](#non-secure)
  * [Custom Alphabet or Size](#custom-alphabet-or-size)
  * [Custom Random Bytes Generator](#custom-random-bytes-generator)


## Comparison with UUID

Nano ID is quite comparable to UUID v4 (random-based).
It has a similar number of random bits in the ID
(126 in Nano ID and 122 in UUID), so it has a similar collision probability:

> For there to be a one in a billion chance of duplication,
> 103 trillion version 4 IDs must be generated.

There are three main differences between Nano ID and UUID v4:

1. Nano ID uses a bigger alphabet, so a similar number of random bits
   are packed in just 21 symbols instead of 36.
2. Nano ID code is **4.5 times less** than `uuid/v4` package:
   108 bytes instead of 483.
3. Because of memory allocation tricks, Nano ID is **60%** faster than UUID.


## Benchmark

```rust
$ node ./test/benchmark.js
nanoid                    2,280,683 ops/sec
customAlphabet            1,851,117 ops/sec
uuid v4                   1,348,425 ops/sec
uid.sync                    313,306 ops/sec
secure-random-string        294,161 ops/sec
cuid                        158,988 ops/sec
shortid                      37,222 ops/sec

Async:
async nanoid                 95,500 ops/sec
async customAlphabet         93,800 ops/sec
async secure-random-string   90,316 ops/sec
uid                          85,583 ops/sec

Non-secure:
non-secure nanoid         2,641,654 ops/sec
rndm                      2,447,086 ops/sec
```

Test configuration: Dell XPS 2-in-1 7390, Fedora 32, Node.js 15.1.


## Tools

* [ID size calculator] shows collision probability when adjusting
  the ID alphabet or size.
* [`nanoid-dictionary`] with popular alphabets to use with `customAlphabet`.
* [`nanoid-good`] to be sure that your ID doesn’t contain any obscene words.

[`nanoid-dictionary`]: https://github.com/CyberAP/nanoid-dictionary
[ID size calculator]:  https://zelark.github.io/nano-id-cc/
[`nanoid-good`]:       https://github.com/y-gagar1n/nanoid-good


## Security

*See a good article about random generators theory:
[Secure random values (in Node.js)]*

* **Unpredictability.** Instead of using the unsafe `Math.random()`, Nano ID
  uses the `crypto` module in Node.js and the Web Crypto API in browsers.
  These modules use unpredictable hardware random generator.
* **Uniformity.** `random % alphabet` is a popular mistake to make when coding
  an ID generator. The distribution will not be even; there will be a lower
  chance for some symbols to appear compared to others. So, it will reduce
  the number of tries when brute-forcing. Nano ID uses a [better algorithm]
  and is tested for uniformity.

  <img src="img/distribution.png" alt="Nano ID uniformity"
     width="340" height="135">

* **Vulnerabilities:** to report a security vulnerability, please use
  the [Tidelift security contact](https://tidelift.com/security).
  Tidelift will coordinate the fix and disclosure.

[Secure random values (in Node.js)]: https://gist.github.com/joepie91/7105003c3b26e65efcea63f3db82dfba
[better algorithm]:                  https://github.com/ai/nanoid/blob/main/index.js


## Usage

### JS

The main module uses URL-friendly symbols (`A-Za-z0-9_-`) and returns an ID
with 21 characters (to have a collision probability similar to UUID v4).

```js
import { nanoid } from 'nanoid'
model.id = nanoid() //=> "V1StGXR8_Z5jdHi6B-myT"
```

In Node.js you can use CommonJS import:

```js
const { nanoid } = require('nanoid')
```

If you want to reduce the ID size (and increase collisions probability),
you can pass the size as an argument.

```js
nanoid(10) //=> "IRFa-VaY2b"
```

Don’t forget to check the safety of your ID size
in our [ID collision probability] calculator.

You can also use a [custom alphabet](#custom-alphabet-or-size)
or a [random generator](#custom-random-bytes-generator).

[ID collision probability]: https://zelark.github.io/nano-id-cc/


### IE

If you support IE, you need to [transpile `node_modules`] by Babel
and add `crypto` alias:

```js
// polyfills.js
if (!window.crypto) {
  window.crypto = window.msCrypto
}
```

```js
import './polyfills.js'
import { nanoid } from 'nanoid'
```

[transpile `node_modules`]: https://developer.epages.com/blog/coding/how-to-transpile-node-modules-with-babel-and-webpack-in-a-monorepo/


### React

There’s currently no correct way to use nanoid for React `key` prop
since it should be consistent among renders.

```jsx
function Todos({todos}) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={nanoid()}> /* DON’T DO IT */
          {todo.text}
        </li>
      ))}
    </ul>
  )
}
```

You should rather try to reach for stable id inside your list item.

```jsx
const todoItems = todos.map((todo) =>
  <li key={todo.id}>
    {todo.text}
  </li>
)
```

In case you don’t have stable ids you'd rather use index as `key`
instead of `nanoid()`:

```jsx
const todoItems = todos.map((text, index) =>
  <li key={index}> /* Still not recommended but preferred over nanoid().
                      Only do this if items have no stable IDs. */
    {text}
  </li>
)
```

If you want to use Nano ID in the `id` prop, you must set some string prefix
(it is invalid for the HTML ID to start with a number).

```jsx
<input id={'id' + this.id} type="text"/>
```


### Create React App

Create React App < 4.0.0 had
[a problem](https://github.com/ai/nanoid/issues/205) with ES modules packages.

```
TypeError: (0 , _nanoid.nanoid) is not a function
```

Use Nano ID 2 `npm i nanoid@^2.0.0` if you're using a version below
CRA 4.0.


### React Native

React Native does not have built-in random generator. The following polyfill
works for plain React Native and Expo starting with `39.x`.

1. Check [`react-native-get-random-values`] docs and install it.
2. Import it before Nano ID.

```js
import 'react-native-get-random-values'
import { nanoid } from 'nanoid'
```

For Expo framework see the next section.

[`react-native-get-random-values`]: https://github.com/LinusU/react-native-get-random-values


### Rollup

For Rollup you will need [`@rollup/plugin-node-resolve`] to bundle browser version
of this library and [`@rollup/plugin-replace`] to replace
`process.env.NODE_ENV`:

```js
  plugins: [
    nodeResolve({
      browser: true
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ]
```

[`@rollup/plugin-node-resolve`]: https://github.com/rollup/plugins/tree/master/packages/node-resolve
[`@rollup/plugin-replace`]: https://github.com/rollup/plugins/tree/master/packages/replace


### PouchDB and CouchDB

In PouchDB and CouchDB, IDs can’t start with an underscore `_`.
A prefix is required to prevent this issue, as Nano ID might use a `_`
at the start of the ID by default.

Override the default ID with the following option:

```js
db.put({
  _id: 'id' + nanoid(),
  …
})
```


### Mongoose

```js
const mySchema = new Schema({
  _id: {
    type: String,
    default: () => nanoid()
  }
})
```


### ES Modules

Nano ID provides ES modules. You do not need to do anything to use Nano ID
as ESM in webpack, Rollup, Parcel, or Node.js.

```js
import { nanoid } from 'nanoid'
```

For quick hacks, you can load Nano ID from CDN. Special minified
`nanoid.js` module is available on jsDelivr.

Though, it is not recommended to be used in production
because of the lower loading performance.

```js
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js'
```


### Web Workers

Web Workers do not have access to a secure random generator.

Security is important in IDs when IDs should be unpredictable.
For instance, in "access by URL" link generation.
If you do not need unpredictable IDs, but you need to use Web Workers,
you can use the non‑secure ID generator.

```js
import { nanoid } from 'nanoid/non-secure'
nanoid() //=> "Uakgb_J5m9g-0JDMbcJqLJ"
```

Note: non-secure IDs are more prone to collision attacks.


### CLI

You can get unique ID in terminal by calling `npx nanoid`. You need only
Node.js in the system. You do not need Nano ID to be installed anywhere.

```sh
$ npx nanoid
npx: installed 1 in 0.63s
LZfXLFzPPR4NNrgjlWDxn
```

If you want to change alphabet or ID size, you should use [`nanoid-cli`].

[`nanoid-cli`]: https://github.com/twhitbeck/nanoid-cli


### Other Programming Languages

Nano ID was ported to many languages. You can use these ports to have
the same ID generator on the client and server side.

* [C#](https://github.com/codeyu/nanoid-net)
* [C++](https://github.com/mcmikecreations/nanoid_cpp)
* [Clojure and ClojureScript](https://github.com/zelark/nano-id)
* [Crystal](https://github.com/mamantoha/nanoid.cr)
* [Dart & Flutter](https://github.com/pd4d10/nanoid-dart)
* [Deno](https://github.com/ianfabs/nanoid)
* [Go](https://github.com/matoous/go-nanoid)
* [Elixir](https://github.com/railsmechanic/nanoid)
* [Haskell](https://github.com/4e6/nanoid-hs)
* [Janet](https://sr.ht/~statianzo/janet-nanoid/)
* [Java](https://github.com/aventrix/jnanoid)
* [Nim](https://github.com/icyphox/nanoid.nim)
* [Perl](https://github.com/tkzwtks/Nanoid-perl)
* [PHP](https://github.com/hidehalo/nanoid-php)
* [Python](https://github.com/puyuan/py-nanoid)
  with [dictionaries](https://pypi.org/project/nanoid-dictionary)
* [Ruby](https://github.com/radeno/nanoid.rb)
* [Rust](https://github.com/nikolay-govorov/nanoid)
* [Swift](https://github.com/antiflasher/NanoID)

Also, [CLI] is available to generate IDs from a command line.

[CLI]: #cli


## API

### Async

To generate hardware random bytes, CPU collects electromagnetic noise.
In the synchronous API during the noise collection, the CPU is busy and
cannot do anything useful in parallel.

Using the asynchronous API of Nano ID, another code can run during
the entropy collection.

```js
import { nanoid } from 'nanoid/async'

async function createUser () {
  user.id = await nanoid()
}
```

Unfortunately, you will lose Web Crypto API advantages in a browser
if you use the asynchronous API. So, currently, in the browser, you are limited
with either security or asynchronous behavior.


### Non-Secure

By default, Nano ID uses hardware random bytes generation for security
and low collision probability. If you are not so concerned with security
and more concerned with performance, you can use the faster non-secure generator.

```js
import { nanoid } from 'nanoid/non-secure'
const id = nanoid() //=> "Uakgb_J5m9g-0JDMbcJqLJ"
```

Note: your IDs will be more predictable and prone to collision attacks.


### Custom Alphabet or Size

`customAlphabet` allows you to create `nanoid` with your own alphabet
and ID size.

```js
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('1234567890abcdef', 10)
model.id = nanoid() //=> "4f90d13a42"
```

Check the safety of your custom alphabet and ID size in our
[ID collision probability] calculator. For more alphabets, check out the options
in [`nanoid-dictionary`].

Alphabet must contain 256 symbols or less.
Otherwise, the security of the internal generator algorithm is not guaranteed.

Customizable asynchronous and non-secure APIs are also available:

```js
import { customAlphabet } from 'nanoid/async'
const nanoid = customAlphabet('1234567890abcdef', 10)
async function createUser () {
  user.id = await nanoid()
}
```

```js
import { customAlphabet } from 'nanoid/non-secure'
const nanoid = customAlphabet('1234567890abcdef', 10)
user.id = nanoid()
```

[ID collision probability]: https://alex7kom.github.io/nano-nanoid-cc/
[`nanoid-dictionary`]:      https://github.com/CyberAP/nanoid-dictionary


### Custom Random Bytes Generator

`customRandom` allows you to create a `nanoid` and replace alphabet
and the default random bytes generator.

In this example, a seed-based generator is used:

```js
import { customRandom } from 'nanoid'

const rng = seedrandom(seed)
const nanoid = customRandom('abcdef', 10, size => {
  return (new Uint8Array(size)).map(() => 256 * rng())
})

nanoid() //=> "fbaefaadeb"
```

`random` callback must accept the array size and return an array
with random numbers.

If you want to use the same URL-friendly symbols with `customRandom`,
you can get the default alphabet using the `urlAlphabet`.

```js
const { customRandom, urlAlphabet } = require('nanoid')
const nanoid = customRandom(urlAlphabet, 10, random)
```

Asynchronous and non-secure APIs are not available for `customRandom`.
