require('fs').readdirSync(__dirname).forEach(function(f) {
  if (f.substr(0, 5) === 'test-')
    require('./' + f);
});