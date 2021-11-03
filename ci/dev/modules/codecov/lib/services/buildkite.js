module.exports = {
  detect: function() {
    return !!process.env.BUILDKITE
  },

  configuration: function() {
    // https://buildkite.com/docs/guides/environment-variables
    console.log('    Buildkite CI Detected')
    return {
      service: 'buildkite',
      build: process.env.BUILDKITE_BUILD_NUMBER,
      build_url: process.env.BUILDKITE_BUILD_URL,
      commit: process.env.BUILDKITE_COMMIT,
      branch: process.env.BUILDKITE_BRANCH,
      slug: process.env.BUILDKITE_PROJECT_SLUG,
    }
  },
}
