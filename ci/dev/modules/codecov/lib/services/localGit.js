var git = require('../git')

module.exports = {
  configuration: function() {
    console.log('    No CI Detected. Using git/mercurial')
    var branch = git.branch()
    if (branch === 'HEAD') {
      branch = 'master'
    }
    var head = git.head()
    return {
      commit: head,
      branch: branch,
    }
  },
}
