module.exports = {
  detect: function() {
    return !!process.env.SEMAPHORE && !!process.env.SEMAPHORE_REPO_SLUG
  },

  configuration: function() {
    console.log('    Semaphore 1.x CI Detected')
    return {
      service: 'semaphore',
      build:
        process.env.SEMAPHORE_BUILD_NUMBER +
        '.' +
        process.env.SEMAPHORE_CURRENT_THREAD,
      commit: process.env.REVISION,
      branch: process.env.BRANCH_NAME,
      slug: process.env.SEMAPHORE_REPO_SLUG,
    }
  },
}
