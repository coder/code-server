var codebuild = require('../../lib/services/codebuild')
var git = require('../../lib/git.js')

// Set all module functions to jest.fn
jest.mock('../../lib/git.js')

describe('AWS CodeBuild Provider', function() {
  it('can detect codebuild', function() {
    process.env.CODEBUILD_CI = 'true'
    expect(codebuild.detect()).toBe(true)
  })

  it('can get codebuild env info', function() {
    process.env.CODEBUILD_CI = 'true'
    process.env.CODEBUILD_BUILD_ID =
      'my-project:e016b9d9-f2c8-4749-8373-7ca673b6d969'
    process.env.CODEBUILD_RESOLVED_SOURCE_VERSION =
      '39ec2418eca4c539d765574a1c68f3bd77e8c549'
    process.env.CODEBUILD_WEBHOOK_HEAD_REF = 'refs/heads/master'
    process.env.CODEBUILD_SOURCE_VERSION = 'pr/1'
    process.env.CODEBUILD_SOURCE_REPO_URL =
      'https://github.com/my-org/my-project.git'
    expect(codebuild.configuration()).toEqual({
      service: 'codebuild',
      build: 'my-project:e016b9d9-f2c8-4749-8373-7ca673b6d969',
      job: 'my-project:e016b9d9-f2c8-4749-8373-7ca673b6d969',
      commit: '39ec2418eca4c539d765574a1c68f3bd77e8c549',
      branch: 'master',
      pr: '1',
      slug: 'my-org/my-project',
    })
  })

  it('throws if branch name cannot be detected', function() {
    delete process.env.CODEBUILD_WEBHOOK_HEAD_REF
    git.branch.mockImplementation(function() {
      throw new Error()
    })
    expect(function() {
      codebuild.configuration()
    }).toThrow()
  })

  it('Test build triggered via AWS SDK', function() {
    delete process.env.CODEBUILD_WEBHOOK_HEAD_REF
    git.branch.mockReturnValue('master')
    expect(codebuild.configuration()).toEqual({
      service: 'codebuild',
      build: 'my-project:e016b9d9-f2c8-4749-8373-7ca673b6d969',
      job: 'my-project:e016b9d9-f2c8-4749-8373-7ca673b6d969',
      commit: '39ec2418eca4c539d765574a1c68f3bd77e8c549',
      branch: 'master',
      pr: undefined,
      slug: 'my-org/my-project',
    })
  })

  it('Test PR build triggered via Github Webhook', function() {
    process.env.CODEBUILD_WEBHOOK_HEAD_REF = 'refs/heads/master'
    expect(codebuild.configuration()).toEqual({
      service: 'codebuild',
      build: 'my-project:e016b9d9-f2c8-4749-8373-7ca673b6d969',
      job: 'my-project:e016b9d9-f2c8-4749-8373-7ca673b6d969',
      commit: '39ec2418eca4c539d765574a1c68f3bd77e8c549',
      branch: 'master',
      pr: '1',
      slug: 'my-org/my-project',
    })
  })

  it('Test non-PR build triggered via Github Webhook', function() {
    process.env.CODEBUILD_WEBHOOK_HEAD_REF = 'refs/heads/master'
    process.env.CODEBUILD_SOURCE_VERSION =
      '39ec2418eca4c539d765574a1c68f3bd77e8c549'
    expect(codebuild.configuration()).toEqual({
      service: 'codebuild',
      build: 'my-project:e016b9d9-f2c8-4749-8373-7ca673b6d969',
      job: 'my-project:e016b9d9-f2c8-4749-8373-7ca673b6d969',
      commit: '39ec2418eca4c539d765574a1c68f3bd77e8c549',
      branch: 'master',
      pr: undefined,
      slug: 'my-org/my-project',
    })
  })

  it('throws if slug cannot be detected', function() {
    process.env.CODEBUILD_RESOLVED_SOURCE_VERSION =
      '39ec2418eca4c539d765574a1c68f3bd77e8c549'
    delete process.env.CODEBUILD_SOURCE_REPO_URL
    expect(function() {
      codebuild.configuration()
    }).toThrow()
  })
})
