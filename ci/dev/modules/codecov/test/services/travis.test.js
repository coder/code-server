var travis = require('../../lib/services/travis')

describe('Travis CI Provider', function() {
  it('can detect travis', function() {
    process.env.TRAVIS = 'true'
    expect(travis.detect()).toBe(true)
  })
  it('can get travis env info get_commit_status', function() {
    process.env.TRAVIS = 'true'
    process.env.TRAVIS_JOB_ID = '1234'
    process.env.TRAVIS_COMMIT = '5678'
    process.env.TRAVIS_JOB_NUMBER = '91011'
    process.env.TRAVIS_BRANCH = 'master'
    process.env.TRAVIS_PULL_REQUEST = 'blah'
    process.env.TRAVIS_BUILD_DIR = '/'
    process.env.TRAVIS_REPO_SLUG = 'owner/repo'
    expect(travis.configuration()).toEqual({
      service: 'travis',
      commit: '5678',
      build: '91011',
      branch: 'master',
      root: '/',
      job: '1234',
      pr: 'blah',
      slug: 'owner/repo',
    })
  })
})
