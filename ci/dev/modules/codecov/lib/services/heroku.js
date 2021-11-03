// https://devcenter.heroku.com/articles/heroku-ci

module.exports = {
  detect: function() {
    return !!process.env.HEROKU_TEST_RUN_ID
  },

  configuration: function() {
    console.log('    heroku CI Detected')
    return {
      service: 'heroku',
      build: process.env.HEROKU_TEST_RUN_ID,
      commit: process.env.HEROKU_TEST_RUN_COMMIT_VERSION,
      branch: process.env.HEROKU_TEST_RUN_BRANCH,
    }
  },
}
