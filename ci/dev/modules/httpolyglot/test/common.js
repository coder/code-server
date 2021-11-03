exports.mustCall = mustCall;
function mustCall(fn, expected) {
  if (typeof expected !== 'number')
    expected = 1;

  var context = {
    expected: expected,
    actual: 0,
    stack: (new Error()).stack,
    name: fn.name || '<anonymous>'
  };

  // add the exit listener only once to avoid listener leak warnings
  if (mustCall.checks.length === 0)
    process.on('exit', mustCall.runChecks);

  mustCall.checks.push(context);

  return function() {
    context.actual++;
    return fn.apply(this, arguments);
  };
}
mustCall.checks = [];
mustCall.runChecks = function(exitCode) {
  if (exitCode !== 0)
    return;

  var failed = mustCall.checks.filter(function(context) {
    return context.actual !== context.expected;
  });

  failed.forEach(function(context) {
    console.log('Mismatched %s function calls. Expected %d, actual %d.',
                context.name,
                context.expected,
                context.actual);
    console.log(context.stack.split('\n').slice(2).join('\n'));
  });

  if (failed.length)
    process.exit(1);
};
