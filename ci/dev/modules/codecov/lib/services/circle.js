module.exports = {
  detect: function() {
    return !!process.env.CIRCLECI
  },

  configuration: function() {
    console.log('    Circle CI Detected')
    return {
      service: 'circleci',
      build: process.env.CIRCLE_BUILD_NUM + '.' + process.env.CIRCLE_NODE_INDEX,
      job: process.env.CIRCLE_BUILD_NUM + '.' + process.env.CIRCLE_NODE_INDEX,
      commit: process.env.CIRCLE_SHA1,
      branch: process.env.CIRCLE_BRANCH,
      pr: process.env.CIRCLE_PR_NUMBER,
      slug: detectRepoSlug(),
    }
    function detectRepoSlug() {
      if (process.env.CIRCLE_PROJECT_REPONAME) {
        // CircleCI 1.0
        //   CIRCLE_PROJECT_REPONAME=codecov
        //   CIRCLE_PROJECT_USERNAME=codecov-node
        //   CIRCLE_REPOSITORY_URL=https://github.com/codecov/codecov-node (note: GitHub Web URL)
        return (
          process.env.CIRCLE_PROJECT_USERNAME +
          '/' +
          process.env.CIRCLE_PROJECT_REPONAME
        )
      }
      if (process.env.CIRCLE_REPOSITORY_URL) {
        // CircleCI 2.0
        //   CIRCLE_REPOSITORY_URL=git@github.com:codecov/codecov-node.git (note: Git/SSH URL)
        return process.env.CIRCLE_REPOSITORY_URL.replace(/^.*:/, '').replace(
          /\.git$/,
          ''
        )
      }
      throw new Error('Cannot detect repository slug.')
    }
  },
}
