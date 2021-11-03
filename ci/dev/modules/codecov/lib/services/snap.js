module.exports = {
  detect: function() {
    return !!process.env.SNAP_CI
  },

  configuration: function() {
    console.log('    Snap CI Detected')
    return {
      service: 'snap',
      build: process.env.SNAP_PIPELINE_COUNTER,
      commit: process.env.SNAP_COMMIT || process.env.SNAP_UPSTREAM_COMMIT,
      branch: process.env.SNAP_BRANCH || process.env.SNAP_UPSTREAM_BRANCH,
      pr: process.env.SNAP_PULL_REQUEST_NUMBER,
    }
  },
}
