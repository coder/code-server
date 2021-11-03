var appveyor = require('../../lib/services/appveyor')

describe('AppVeyor CI Provider', function() {
  it('can detect appveyor', function() {
    process.env.APPVEYOR = 'true'
    expect(appveyor.detect()).toBe(true)
  })

  it('can get appveyor env info', function() {
    process.env.APPVEYOR_ACCOUNT_NAME = 'a'
    process.env.APPVEYOR_PROJECT_SLUG = 'b'
    process.env.APPVEYOR_REPO_COMMIT = '5678'
    process.env.APPVEYOR_REPO_BRANCH = 'master'
    process.env.APPVEYOR_PULL_REQUEST_NUMBER = '1'
    process.env.APPVEYOR_BUILD_VERSION = 'job'
    process.env.APPVEYOR_JOB_ID = 'build'
    process.env.APPVEYOR_REPO_NAME = 'owner/repo'

    expect(appveyor.configuration()).toEqual({
      service: 'appveyor',
      commit: '5678',
      build: 'build',
      job: 'a/b/job',
      pr: '1',
      branch: 'master',
      slug: 'owner/repo',
    })
  })
})
