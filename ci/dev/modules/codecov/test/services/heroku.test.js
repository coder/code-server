var heroku = require('../../lib/services/heroku')

describe('Heroku CI Provider', function() {
  it('can detect heroku', function() {
    process.env.HEROKU_TEST_RUN_ID = '454f5dc9-afa4-433f-bb28-84678a00fd98'
    expect(heroku.detect()).toBe(true)
  })

  it('can get wercker env info', function() {
    process.env.HEROKU_TEST_RUN_ID = '454f5dc9-afa4-433f-bb28-84678a00fd98'
    process.env.HEROKU_TEST_RUN_COMMIT_VERSION =
      '743b04806ea677403aa2ff26c6bdeb85005de658'
    process.env.HEROKU_TEST_RUN_BRANCH = 'master'
    expect(heroku.configuration()).toEqual({
      service: 'heroku',
      commit: '743b04806ea677403aa2ff26c6bdeb85005de658',
      build: '454f5dc9-afa4-433f-bb28-84678a00fd98',
      branch: 'master',
    })
  })
})
