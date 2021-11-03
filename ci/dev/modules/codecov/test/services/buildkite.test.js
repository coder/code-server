var buildkite = require('../../lib/services/buildkite')

describe('Buildkite CI Provider', function() {
  it('can detect buildkite', function() {
    process.env.BUILDKITE = 'true'
    expect(buildkite.detect()).toBe(true)
  })

  it('can get buildkite env info', function() {
    process.env.BUILDKITE_BUILD_NUMBER = '1'
    process.env.BUILDKITE_BUILD_URL = 'url'
    process.env.BUILDKITE_COMMIT = 'commit'
    process.env.BUILDKITE_BRANCH = 'branch'
    process.env.BUILDKITE_PROJECT_SLUG = 'slug'

    expect(buildkite.configuration()).toEqual({
      service: 'buildkite',
      build: '1',
      build_url: 'url',
      commit: 'commit',
      branch: 'branch',
      slug: 'slug',
    })
  })
})
