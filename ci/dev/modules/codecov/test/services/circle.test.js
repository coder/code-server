var circle = require('../../lib/services/circle')

describe('Circle CI Provider', function() {
  it('can detect circle', function() {
    process.env.CIRCLECI = 'true'
    expect(circle.detect()).toBe(true)
  })

  it('can get circle env info (CircleCI 1.0)', function() {
    process.env.CIRCLECI = 'true'
    process.env.CIRCLE_BUILD_NUM = '1234'
    process.env.CIRCLE_SHA1 = '5678'
    process.env.CIRCLE_BRANCH = 'master'
    process.env.CIRCLE_NODE_INDEX = '1'
    process.env.CIRCLE_PR_NUMBER = 'blah'
    process.env.CIRCLE_PROJECT_USERNAME = 'owner'
    process.env.CIRCLE_PROJECT_REPONAME = 'repo'
    expect(circle.configuration()).toEqual({
      service: 'circleci',
      commit: '5678',
      build: '1234.1',
      job: '1234.1',
      branch: 'master',
      pr: 'blah',
      slug: 'owner/repo',
    })
  })

  it('can get circle env info (CircleCI 2.0)', function() {
    process.env.CIRCLECI = 'true'
    process.env.CIRCLE_BRANCH = 'master'
    process.env.CIRCLE_BUILD_NUM = '1234'
    process.env.CIRCLE_SHA1 = 'abcd'
    process.env.CIRCLE_NODE_INDEX = '1'
    process.env.CIRCLE_BUILD_URL = 'https://circleci.com/gh/owner/repo/1234'
    process.env.CIRCLE_COMPARE_URL =
      'https://github.com/owner/repo/2408ca9...3c36cfa'
    process.env.CIRCLE_NODE_INDEX = '1'
    process.env.CIRCLE_REPOSITORY_URL = 'git@github.com:owner/repo.git'
    delete process.env.CIRCLE_PR_NUMBER
    delete process.env.CIRCLE_PROJECT_USERNAME
    delete process.env.CIRCLE_PROJECT_REPONAME
    expect(circle.configuration()).toEqual({
      service: 'circleci',
      commit: 'abcd',
      build: '1234.1',
      job: '1234.1',
      branch: 'master',
      pr: undefined,
      slug: 'owner/repo',
    })
  })

  it('throws if repo slug cannot be detected', function() {
    delete process.env.CIRCLE_PR_NUMBER
    delete process.env.CIRCLE_PROJECT_USERNAME
    delete process.env.CIRCLE_PROJECT_REPONAME
    delete process.env.CIRCLE_REPOSITORY_URL
    expect(function() {
      circle.configuration()
    }).toThrow()
  })
})
