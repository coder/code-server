module.exports = {
  detect: function() {
    return !!process.env.SEMAPHORE && !!process.env.SEMAPHORE_WORKFLOW_ID
  },

  configuration: function() {
    console.log('    Semaphore 2.x CI Detected')
    return {
      service: 'semaphore',
      branch: process.env.SEMAPHORE_GIT_BRANCH,
      build: process.env.SEMAPHORE_WORKFLOW_ID,
      commit: process.env.SEMAPHORE_GIT_SHA,
    }
  },
}
