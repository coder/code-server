module.exports = {
  detect: function() {
    return !!process.env.TF_BUILD
  },

  configuration: function() {
    console.log('    Azure Pipelines CI Detected')
    return {
      service: 'azure_pipelines',
      commit: process.env.BUILD_SOURCEVERSION,
      branch: process.env.BUILD_SOURCEBRANCH,
      pr: process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER,
      job: process.env.SYSTEM_JOBID,
      build: process.env.BUILD_BUILDID,
      build_url:
        process.env.SYSTEM_TEAMFOUNDATIONSERVERURI +
        process.env.SYSTEM_TEAMPROJECT +
        '/_build/results?buildId=' +
        process.env.BUILD_BUILDID,
      slug: process.env.BUILD_REPOSITORY_ID,
    }
  },
}
