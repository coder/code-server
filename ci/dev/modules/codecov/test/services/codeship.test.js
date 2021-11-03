var codeship = require('../../lib/services/codeship')

describe('Codeship CI Provider', function() {
  it('can detect codeship', function() {
    process.env.CI_NAME = 'codeship'
    expect(codeship.detect()).toBe(true)
  })

  it('can get codeship env info', function() {
    process.env.CI_BUILD_NUMBER = '1234'
    process.env.CI_COMMIT_ID = '5678'
    process.env.CI_BRANCH = 'master'
    process.env.CI_BUILD_URL = 'https://...'

    expect(codeship.configuration()).toEqual({
      service: 'codeship',
      commit: '5678',
      build: '1234',
      branch: 'master',
      build_url: 'https://...',
    })
  })
})
