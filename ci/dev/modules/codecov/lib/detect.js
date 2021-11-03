var services = {
  travis: require('./services/travis'),
  circle: require('./services/circle'),
  cirrus: require('./services/cirrus'),
  buildkite: require('./services/buildkite'),
  azurePipelines: require('./services/azurePipelines'),
  codeship: require('./services/codeship'),
  drone: require('./services/drone'),
  appveyor: require('./services/appveyor'),
  wercker: require('./services/wercker'),
  jenkins: require('./services/jenkins'),
  semaphore: require('./services/semaphore'),
  semaphore2x: require('./services/semaphore2x'),
  snap: require('./services/snap'),
  gitlab: require('./services/gitlab'),
  heroku: require('./services/heroku'),
  teamcity: require('./services/teamcity'),
  codebuild: require('./services/codebuild'),
  github_actions: require('./services/github_actions'),
}

var detectProvider = function() {
  var config
  for (var name in services) {
    if (services[name].detect()) {
      config = services[name].configuration()
      break
    }
  }
  if (!config) {
    var local = require('./services/localGit')
    config = local.configuration()
    if (!config) {
      throw new Error('Unknown CI service provider. Unable to upload coverage.')
    }
  }
  return config
}

module.exports = detectProvider
