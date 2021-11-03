var semaphore = require('../../lib/services/semaphore')

describe('Semaphore CI Provider', function() {
  var OLD_ENV = process.env

  beforeEach(function() {
    process.env = Object.assign({}, OLD_ENV)
  })

  afterEach(function() {
    process.env = Object.assign({}, OLD_ENV)
  })

  it('can detect semaphore', function() {
    process.env.SEMAPHORE = 'true'
    process.env.SEMAPHORE_REPO_SLUG = 'owner/repo'
    expect(semaphore.detect()).toBe(true)
  })

  it('does not detect semaphore 2.x', function() {
    process.env.SEMAPHORE = 'true'
    process.env.SEMAPHORE_WORKFLOW_ID = '65c9bb1c-aeb6-41f0-b8d9-6fa177241cdf'
    expect(semaphore.detect()).toBe(false)
  })

  it('can get semaphore env info', function() {
    process.env.SEMAPHORE_BUILD_NUMBER = '1234'
    process.env.REVISION = '5678'
    process.env.SEMAPHORE_CURRENT_THREAD = '1'
    process.env.BRANCH_NAME = 'master'
    process.env.SEMAPHORE_REPO_SLUG = 'owner/repo'
    expect(semaphore.configuration()).toEqual({
      service: 'semaphore',
      commit: '5678',
      build: '1234.1',
      branch: 'master',
      slug: 'owner/repo',
    })
  })
})
