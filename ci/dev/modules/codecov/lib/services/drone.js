var git = require('../git')

module.exports = {
  detect: function() {
    return !!process.env.DRONE
  },

  configuration: function() {
    console.log('    Drone.io CI Detected')
    return {
      service: 'drone.io',
      build: process.env.DRONE_BUILD_NUMBER,
      commit: git.head(),
      build_url: process.env.DRONE_BUILD_URL,
      branch: process.env.DRONE_BRANCH,
      root: process.env.DRONE_BUILD_DIR,
    }
  },
}
