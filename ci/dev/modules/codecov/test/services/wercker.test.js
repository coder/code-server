var wercker = require('../../lib/services/wercker')

describe('Wercker CI Provider', function() {
  it('can detect wercker', function() {
    process.env.WERCKER_MAIN_PIPELINE_STARTED = '1399372237'
    expect(wercker.detect()).toBe(true)
  })

  it('can get wercker env info', function() {
    process.env.WERCKER_MAIN_PIPELINE_STARTED = '1399372237'
    process.env.WERCKER_GIT_COMMIT = '5678'
    process.env.WERCKER_GIT_BRANCH = 'master'
    process.env.WERCKER_BUILD_URL = 'https://...'
    process.env.WERCKER_GIT_OWNER = 'owner'
    process.env.WERCKER_GIT_REPOSITORY = 'repo'
    expect(wercker.configuration()).toEqual({
      service: 'wercker',
      commit: '5678',
      build: '1399372237',
      branch: 'master',
      build_url: 'https://...',
      slug: 'owner/repo',
    })
  })
})
