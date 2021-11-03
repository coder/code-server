var drone = require('../../lib/services/drone')
var git = require('../../lib/git')

describe('Drone.io CI Provider', function() {
  it('can detect drone', function() {
    process.env.DRONE = 'true'
    expect(drone.detect()).toBe(true)
  })

  it('can get drone env info', function() {
    process.env.DRONE_BUILD_NUMBER = '1234'
    process.env.DRONE_BRANCH = 'master'
    process.env.DRONE_BUILD_URL = 'https://...'
    process.env.DRONE_BUILD_DIR = '/'
    expect(drone.configuration()).toEqual({
      service: 'drone.io',
      commit: git.head(),
      build: '1234',
      root: '/',
      branch: 'master',
      build_url: 'https://...',
    })
  })
})
