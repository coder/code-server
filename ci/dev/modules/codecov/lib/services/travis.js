module.exports = {
  detect: function() {
    return !!process.env.TRAVIS
  },

  configuration: function() {
    console.log('    Travis CI Detected')
    return {
      service: 'travis',
      commit: process.env.TRAVIS_COMMIT,
      build: process.env.TRAVIS_JOB_NUMBER,
      branch: process.env.TRAVIS_BRANCH,
      job: process.env.TRAVIS_JOB_ID,
      pr: process.env.TRAVIS_PULL_REQUEST,
      slug: process.env.TRAVIS_REPO_SLUG,
      root: process.env.TRAVIS_BUILD_DIR,
    }
  },
}
