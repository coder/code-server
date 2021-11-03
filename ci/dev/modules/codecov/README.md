# Codecov NodeJS Uploader

[![codecov.io](https://codecov.io/github/codecov/codecov-node/coverage.svg?branch=master)](https://codecov.io/github/codecov/codecov-node?branch=master)
[![NPM version][npm-image]][npm-url]
[![Build Status][github-actions-image]][github-actions-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][depstat-image]][depstat-url]
[![Dev Dependency Status][devdepstat-image]][devdepstat-url]
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fcodecov%2Fcodecov-node.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fcodecov%2Fcodecov-node?ref=badge_shield)

[Codecov.io](https://codecov.io/) support for node.js.

## Installation:

Add the latest version of `codecov` to your package.json:

```
npm install codecov --save-dev
```

or

```
yarn add codecov --dev
```

## Usage:

This script ( `bin/codecov` ) detect your CI provider and all coverage reports and uploads them to Codecov.

Once your app is instrumented for coverage, and building, simply call `./node_modules/.bin/codecov`.

This library currently supports the following CI companies: [Travis CI](https://travis-ci.org/), [Travis](https://travis-ci.com/), [Appveyor](https://appveyor.com/), [CircleCI](https://circleci.com/), [Cirrus CI](https://cirrus-ci.org/), [Codeship](https://codeship.io/), [Drone](https://drone.io/), [Jenkins](http://jenkins-ci.org/), [Shippable](https://shippable.com/), [Semaphore](https://semaphoreapp.com/), [Wercker](https://wercker.com/), [Snap CI](https://snap-ci.com/), [Buildkite](https://buildkite.com/), [AWS CodeBuild](https://aws.amazon.com/codebuild/).

#### Upload repo tokens

> Repo tokens are **not** required for public repos tested on Travis-Org, CircleCI or AppVeyor.

Repo tokens are necessary to distinguish your repository from others. You can find your repo token on your repository page at Codecov. Set this unique uuid to `CODECOV_TOKEN` in your environment variables.

```
export CODECOV_TOKEN=":uuid-repo-token"
# or
./node_modules/.bin/codecov --token=:token
# or
./node_modules/.bin/nyc report --reporter=text-lcov | ./node_modules/.bin/codecov --pipe
```

#### [Istanbul](https://github.com/gotwarlost/istanbul)

**With Mocha:**

```sh
istanbul cover ./node_modules/mocha/bin/_mocha -- -R spec
./node_modules/.bin/codecov
```

**With Jasmine:**

```sh
istanbul cover jasmine-node --captureExceptions spec/
./node_modules/.bin/codecov
```

**With Tape:**

```sh
istanbul cover test.js
./node_modules/.bin/codecov
```

[appveyor-url]: https://ci.appveyor.com/project/eddiemoore/codecov-node-s38o6/branch/master
[github-actions-image]: https://github.com/codecov/codecov-node/workflows/Node%20CI/badge.svg
[github-actions-url]: https://github.com/codecov/codecov-node/actions?query=workflow%3A%22Node+CI%22
[travis-image]: https://travis-ci.org/codecov/codecov-node.svg?branch=master
[travis-url]: https://travis-ci.org/codecov/codecov-node
[npm-url]: https://npmjs.org/package/codecov
[npm-image]: https://img.shields.io/npm/v/codecov.svg
[depstat-url]: https://david-dm.org/codecov/codecov-node
[depstat-image]: https://david-dm.org/codecov/codecov-node/status.svg
[devdepstat-url]: https://david-dm.org/codecov/codecov-node?type=dev
[devdepstat-image]: https://david-dm.org/codecov/codecov-node/dev-status.svg

**With NYC**

```
nyc npm test
nyc report --reporter=lcov
./node_modules/.bin/codecov
```

## Troubleshooting

If you're seeing an **HTTP 400 error when uploading reports to S3**, make sure you've updated to at least version 3.7.0.


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fcodecov%2Fcodecov-node.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fcodecov%2Fcodecov-node?ref=badge_large)