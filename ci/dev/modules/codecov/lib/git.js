var execSync = require('child_process').execSync

module.exports = {
  branch: function() {
    return execSync('git rev-parse --abbrev-ref HEAD || hg branch')
      .toString()
      .trim()
  },

  head: function() {
    return execSync("git log -1 --pretty=%H || hg id -i --debug | tr -d '+'")
      .toString()
      .trim()
  },
}
