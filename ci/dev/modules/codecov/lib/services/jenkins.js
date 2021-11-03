var git = require('../git')

module.exports = {
  detect: function() {
    return !!process.env.JENKINS_URL
  },

  configuration: function() {
    console.log('    Jenkins CI Detected')
    return {
      service: 'jenkins',
      commit:
        process.env.ghprbActualCommit || process.env.GIT_COMMIT || git.head(),
      branch:
        process.env.ghprbSourceBranch ||
        process.env.GIT_BRANCH ||
        process.env.BRANCH_NAME,
      build: process.env.BUILD_NUMBER,
      build_url: process.env.BUILD_URL,
      root: process.env.WORKSPACE,
      pr: process.env.ghprbPullId || process.env.CHANGE_ID,
    }
  },
}
