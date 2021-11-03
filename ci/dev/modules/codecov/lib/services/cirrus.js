module.exports = {
  detect: function() {
    return !!process.env.CIRRUS_CI
  },
  configuration: function() {
    console.log('    Cirrus CI Detected')
    return {
      service: 'cirrus-ci',
      build: process.env.CIRRUS_BUILD_ID,
      job: process.env.CIRRUS_TASK_ID,
      commit: process.env.CIRRUS_CHANGE_IN_REPO,
      branch: process.env.CIRRUS_BRANCH,
      pr: process.env.CIRRUS_PR,
      slug: process.env.CIRRUS_REPO_FULL_NAME,
    }
  },
}
