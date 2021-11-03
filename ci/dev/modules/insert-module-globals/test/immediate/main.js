var immediate = setImmediate(function () {
    T.fail('should have been cleared')
})
setImmediate(function () {
    T.pass('should call setImmediate')
})

clearImmediate(immediate)
