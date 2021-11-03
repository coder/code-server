var gitlab = require('../../lib/services/gitlab')

describe('Gitlab CI Provider', function() {
  it('can detect gitlab', function() {
    process.env.GITLAB_CI = 'true'
    expect(gitlab.detect()).toBe(true)
  })

  it('cannot detect gitlab', function() {
    delete process.env.GITLAB_CI
    expect(gitlab.detect()).toBe(false)
  })

  it('can get service env info', function() {
    process.env.CI_BUILD_ID = '1234'
    process.env.CI_BUILD_REPO = 'https://gitlab.com/owner/repo.git'
    process.env.CI_BUILD_REF = '5678'
    process.env.CI_BUILD_REF_NAME = 'master'
    process.env.CI_PROJECT_DIR = '/'
    expect(gitlab.configuration()).toEqual({
      service: 'gitlab',
      build: '1234',
      root: '/',
      commit: '5678',
      slug: 'owner/repo',
      branch: 'master',
    })
    delete process.env.CI_BUILD_REPO
    process.env.CI_REPOSITORY_URL = 'https://gitlab.com/owner/repo2.git'
    expect(gitlab.configuration()).toEqual({
      service: 'gitlab',
      build: '1234',
      root: '/',
      commit: '5678',
      slug: 'owner/repo2',
      branch: 'master',
    })
    delete process.env.CI_REPOSITORY_URL
    expect(gitlab.configuration()).toEqual({
      service: 'gitlab',
      build: '1234',
      root: '/',
      commit: '5678',
      slug: '',
      branch: 'master',
    })
  })
})
