var azurePipelines = require('../../lib/services/azurePipelines')

describe('Azure Pipelines CI Provider', function() {
  it('can detect azure pipelines', function() {
    process.env.TF_BUILD = '1'
    expect(azurePipelines.detect()).toBe(true)
  })

  it('can get azure pipelines env info', function() {
    process.env.BUILD_SOURCEBRANCH = 'master'
    process.env.SYSTEM_JOBID = '92a2fa25-f940-5df6-a185-81eb9ae2031d'
    process.env.BUILD_BUILDID = '1'
    process.env.SYSTEM_TEAMFOUNDATIONSERVERURI =
      'https://dev.azure.com/codecov/'
    process.env.SYSTEM_TEAMPROJECT = 'repo'
    process.env.BUILD_SOURCEVERSION = '743b04806ea677403aa2ff26c6bdeb85005de658'
    process.env.BUILD_REPOSITORY_ID = 'owner/repo'
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER = '1234'

    expect(azurePipelines.configuration()).toEqual({
      service: 'azure_pipelines',
      build: '1',
      build_url: 'https://dev.azure.com/codecov/repo/_build/results?buildId=1',
      job: '92a2fa25-f940-5df6-a185-81eb9ae2031d',
      commit: '743b04806ea677403aa2ff26c6bdeb85005de658',
      pr: '1234',
      branch: 'master',
      slug: 'owner/repo',
    })
  })
})
