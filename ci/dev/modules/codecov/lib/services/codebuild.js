var git = require('../git.js')

module.exports = {
  detect: function() {
    return !!process.env.CODEBUILD_CI
  },

  configuration: function() {
    console.log('    AWS CodeBuild Detected')
    return {
      service: 'codebuild',
      build: process.env.CODEBUILD_BUILD_ID,
      job: process.env.CODEBUILD_BUILD_ID,
      commit: process.env.CODEBUILD_RESOLVED_SOURCE_VERSION,
      branch: detectBranchName(),
      pr: detectPRNumber(),
      slug: detectRepoSlug(),
    }
    function detectBranchName() {
      if (process.env.CODEBUILD_WEBHOOK_HEAD_REF) {
        return process.env.CODEBUILD_WEBHOOK_HEAD_REF.replace(
          /^refs\/heads\//,
          ''
        )
      }
      return git.branch()
    }
    function detectPRNumber() {
      if (
        process.env.CODEBUILD_WEBHOOK_HEAD_REF &&
        process.env.CODEBUILD_SOURCE_VERSION.startsWith('pr/')
      ) {
        return process.env.CODEBUILD_SOURCE_VERSION.replace(/^pr\//, '')
      }
      return undefined
    }
    function detectRepoSlug() {
      if (process.env.CODEBUILD_SOURCE_REPO_URL) {
        return process.env.CODEBUILD_SOURCE_REPO_URL.replace(
          /^.*github.com\//,
          ''
        ).replace(/\.git$/, '')
      }
      throw new Error('Cannot detect repository slug.')
    }
  },
}
