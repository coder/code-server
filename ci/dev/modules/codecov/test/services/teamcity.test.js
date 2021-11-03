var teamcity = require('../../lib/services/teamcity')

describe('TeamCity CI Provider', function() {
  it('can detect teamcity', function() {
    process.env.TEAMCITY_VERSION = '8910'
    expect(teamcity.detect()).toBe(true)
  })

  it('can get teamcity env info get_commit_status', function() {
    process.env.TEAMCITY_VERSION = '8910'
    process.env.BUILD_VCS_NUMBER = '4567'
    process.env.BRANCH_NAME = 'ABranch'
    process.env.BUILD_NUMBER = '1234'

    expect(teamcity.configuration()).toEqual({
      service: 'teamcity',
      commit: '4567',
      branch: 'ABranch',
      build: '1234',
    })
  })
})
