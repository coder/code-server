module.exports = {
  detect: function() {
    return process.env.CI_NAME && process.env.CI_NAME === 'codeship'
  },

  configuration: function() {
    console.log('    Codeship CI Detected')
    return {
      service: 'codeship',
      build: process.env.CI_BUILD_NUMBER,
      build_url: process.env.CI_BUILD_URL,
      commit: process.env.CI_COMMIT_ID,
      branch: process.env.CI_BRANCH,
    }
  },
}
