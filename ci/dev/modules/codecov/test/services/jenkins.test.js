var jenkins = require('../../lib/services/jenkins')
var git = require('../../lib/git')

describe('Jenkins CI Provider', function() {
  it('can detect jenkins', function() {
    process.env.JENKINS_URL = 'http://jenkins.jenkins.example/'
    expect(jenkins.detect()).toBe(true)
  })

  it('can get service env info', function() {
    process.env.BUILD_NUMBER = '1234'
    process.env.BUILD_URL = 'http://asdf/'
    process.env.GIT_COMMIT = '5678'
    process.env.GIT_BRANCH = 'master'
    process.env.WORKSPACE = '/'
    expect(jenkins.configuration()).toEqual({
      service: 'jenkins',
      build_url: 'http://asdf/',
      build: '1234',
      root: '/',
      commit: '5678',
      pr: undefined,
      branch: 'master',
    })
  })

  it('can get service env info when using Blue Ocean', function() {
    delete process.env.GIT_COMMIT
    delete process.env.GIT_BRANCH
    process.env.BUILD_NUMBER = '1234'
    process.env.BUILD_URL = 'http://asdf/'
    process.env.BRANCH_NAME = 'master'
    process.env.WORKSPACE = '/'
    expect(jenkins.configuration()).toEqual({
      service: 'jenkins',
      build_url: 'http://asdf/',
      build: '1234',
      root: '/',
      commit: git.head(),
      pr: undefined,
      branch: 'master',
    })
  })

  it('github pull request env variables win out over jenkins variables', function() {
    process.env.BUILD_NUMBER = '1234'
    process.env.BUILD_URL = 'http://asdf/'
    process.env.GIT_COMMIT = '5678'
    process.env.ghprbActualCommit = '8765'
    process.env.GIT_BRANCH = 'master'
    process.env.ghprbSourceBranch = 'retsam'
    process.env.ghprbPullId = '1111'
    process.env.WORKSPACE = '/'
    expect(jenkins.configuration()).toEqual({
      service: 'jenkins',
      build_url: 'http://asdf/',
      build: '1234',
      root: '/',
      commit: '8765',
      pr: '1111',
      branch: 'retsam',
    })
  })
})
