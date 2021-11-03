var detect = require('../lib/detect')
var git = require('../lib/git')

describe('Codecov', function() {
  it('can detect existing appveyor service', function() {
    process.env.TRAVIS = 'true'

    expect(detect().service).toBe('travis')

    process.env.TRAVIS = ''
  })

  it('can select local git service if no service is found', function() {
    expect(detect().commit).toMatch(/^\w{40}$/)
    expect(detect().commit).toBe(git.head())
  })
})
