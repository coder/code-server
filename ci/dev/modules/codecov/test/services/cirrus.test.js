var cirrus = require('../../lib/services/cirrus')

describe('Cirrus CI Provider', function() {
  it('can detect cirrus', function() {
    process.env.CIRRUS_CI = 'true'
    expect(cirrus.detect()).toBe(true)
  })

  it('can get cirrus env info', function() {
    process.env.CIRRUS_CI = 'true'
    process.env.CIRRUS_BUILD_ID = '1234.1'
    process.env.CIRRUS_CHANGE_IN_REPO = '5678'
    process.env.CIRRUS_BRANCH = 'master'
    process.env.CIRRUS_TASK_ID = '1234.1'
    process.env.CIRRUS_PR = 'blah'
    process.env.CIRRUS_REPO_FULL_NAME = 'owner/repo'
    expect(cirrus.configuration()).toEqual({
      service: 'cirrus-ci',
      commit: '5678',
      build: '1234.1',
      job: '1234.1',
      branch: 'master',
      pr: 'blah',
      slug: 'owner/repo',
    })
  })
})
