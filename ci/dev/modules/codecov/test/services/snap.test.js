var snap = require('../../lib/services/snap')

describe('Snap CI Provider', function() {
  it('can detect snap', function() {
    process.env.SNAP_CI = 'true'
    expect(snap.detect()).toBe(true)
  })

  it('can get snap env info get_commit_status', function() {
    process.env.SNAP_CI = 'true'
    process.env.SNAP_PIPELINE_COUNTER = '1234'
    process.env.SNAP_COMMIT = '5678'
    process.env.SNAP_BRANCH = 'master'
    process.env.SNAP_PULL_REQUEST_NUMBER = 'blah'
    expect(snap.configuration()).toEqual({
      service: 'snap',
      commit: '5678',
      build: '1234',
      branch: 'master',
      pr: 'blah',
    })
  })

  it('can get snap env info get_commit_status for pull requests', function() {
    process.env.SNAP_COMMIT = ''
    process.env.SNAP_BRANCH = ''
    process.env.SNAP_CI = 'true'
    process.env.SNAP_PIPELINE_COUNTER = '1234'
    process.env.SNAP_UPSTREAM_COMMIT = '5678'
    process.env.SNAP_UPSTREAM_BRANCH = 'upstream-branch'
    process.env.SNAP_PULL_REQUEST_NUMBER = 'blah'
    expect(snap.configuration()).toEqual({
      service: 'snap',
      commit: '5678',
      build: '1234',
      branch: 'upstream-branch',
      pr: 'blah',
    })
  })
})
