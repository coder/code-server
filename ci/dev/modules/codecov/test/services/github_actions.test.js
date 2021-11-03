var github_actions = require('../../lib/services/github_actions')

describe('GitHub Actions CI Provider', function() {
  it('can detect GitHub Actions', function() {
    process.env.GITHUB_ACTIONS = '1'
    expect(github_actions.detect()).toBe(true)
  })

  it('can get GitHub Actions env info on push event', function() {
    delete process.env.GITHUB_HEAD_REF
    process.env.GITHUB_REF = 'refs/heads/master'
    process.env.GITHUB_REPOSITORY = 'codecov/codecov-repo'
    process.env.GITHUB_RUN_ID = '257701960'
    process.env.GITHUB_SHA = '743b04806ea677403aa2ff26c6bdeb85005de658'

    expect(github_actions.configuration()).toEqual({
      branch: 'master',
      build: '257701960',
      commit: '743b04806ea677403aa2ff26c6bdeb85005de658',
      service: 'github-actions',
      slug: 'codecov/codecov-repo',
    })
  })

  it('can get GitHub Actions env info on pull request', function() {
    process.env.GITHUB_HEAD_REF = 'develop'
    process.env.GITHUB_REF = 'refs/pull/7/merge'
    process.env.GITHUB_REPOSITORY = 'codecov/codecov-repo'
    process.env.GITHUB_RUN_ID = '257701960'
    process.env.GITHUB_SHA = '743b04806ea677403aa2ff26c6bdeb85005de658'

    expect(github_actions.configuration()).toEqual({
      branch: 'develop',
      build: '257701960',
      commit: '743b04806ea677403aa2ff26c6bdeb85005de658',
      pr: '7',
      service: 'github-actions',
      slug: 'codecov/codecov-repo',
    })
  })
})
