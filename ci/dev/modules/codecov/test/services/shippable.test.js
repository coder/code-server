var shippable = require('../../lib/services/shippable')

describe('Shippable CI Provider', function() {
  it('can detect shippable', function() {
    process.env.SHIPPABLE = 'true'
    expect(shippable.detect()).toBe(true)
  })
  it('can get shippable env info get_commit_status', function() {
    process.env.SHIPPABLE = 'true'
    process.env.BUILD_URL = 'http://...'
    process.env.COMMIT = '5678'
    process.env.BUILD_NUMBER = '91011'
    process.env.BUILD_URL = 'http://...'
    process.env.BRANCH = 'master'
    process.env.PULL_REQUEST = '2'
    process.env.REPO_NAME = 'owner/repo'
    expect(shippable.configuration()).toEqual({
      service: 'shippable',
      commit: '5678',
      build: '91011',
      build_url: 'http://...',
      branch: 'master',
      pr: '2',
      slug: 'owner/repo',
    })
  })
})
