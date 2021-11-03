// https://docs.gitlab.com/ce/ci/variables/README.html

module.exports = {
  detect: function() {
    return !!process.env.GITLAB_CI
  },

  configuration: function() {
    console.log('    Gitlab CI Detected')
    var remote =
      process.env.CI_BUILD_REPO || process.env.CI_REPOSITORY_URL || ''
    return {
      service: 'gitlab',
      build: process.env.CI_BUILD_ID,
      commit: process.env.CI_BUILD_REF,
      branch: process.env.CI_BUILD_REF_NAME,
      root: process.env.CI_PROJECT_DIR,
      slug: remote
        .split('/')
        .slice(3, 5)
        .join('/')
        .replace('.git', ''),
    }
  },
}
