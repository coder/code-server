var semaphore2 = require('../../lib/services/semaphore2x')

describe('Semaphore 2.x CI Provider', function() {
  var OLD_ENV = process.env

  beforeEach(function() {
    process.env = Object.assign({}, OLD_ENV)
  })

  afterEach(function() {
    process.env = Object.assign({}, OLD_ENV)
  })

  it('can detect semaphore 2x', function() {
    process.env.SEMAPHORE = 'true'
    process.env.SEMAPHORE_WORKFLOW_ID = '65c9bb1c-aeb6-41f0-b8d9-6fa177241cdf'
    expect(semaphore2.detect()).toBe(true)
  })

  it('does not detect semaphore 1.x', function() {
    process.env.SEMAPHORE = 'true'
    process.env.SEMAPHORE_REPO_SLUG = 'owner/repo'
    expect(semaphore2.detect()).toBe(false)
  })

  it('can get semaphore env info', function() {
    process.env.SEMAPHORE_GIT_BRANCH = 'development'
    process.env.SEMAPHORE_GIT_SHA = '5c84719708b9b649b9ef3b56af214f38cee6acde'
    process.env.SEMAPHORE_WORKFLOW_ID = '65c9bb1c-aeb6-41f0-b8d9-6fa177241cdf'
    expect(semaphore2.configuration()).toEqual({
      service: 'semaphore',
      branch: 'development',
      build: '65c9bb1c-aeb6-41f0-b8d9-6fa177241cdf',
      commit: '5c84719708b9b649b9ef3b56af214f38cee6acde',
    })
  })
})
