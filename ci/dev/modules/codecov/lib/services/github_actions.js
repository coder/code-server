module.exports = {
  detect: function() {
    return !!process.env.GITHUB_ACTIONS
  },

  configuration: function() {
    // https://help.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables#default-environment-variables
    console.log('    GitHub Actions CI Detected')

    var params = {
      branch:
        process.env.GITHUB_HEAD_REF ||
        process.env.GITHUB_REF.replace('refs/heads/', ''),
      build: process.env.GITHUB_RUN_ID,
      commit: process.env.GITHUB_SHA,
      service: 'github-actions',
      slug: process.env.GITHUB_REPOSITORY,
    }

    if (process.env.GITHUB_HEAD_REF) {
      // PR refs are in the format: refs/pull/7/merge for pull_request events
      params['pr'] = process.env.GITHUB_REF.split('/')[2]
    }

    return params
  },
}
