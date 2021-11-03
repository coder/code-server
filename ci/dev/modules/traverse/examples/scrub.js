// scrub out circular references
var traverse = require('traverse');

var obj = { a : 1, b : 2, c : [ 3, 4 ] };
obj.c.push(obj);

var scrubbed = traverse(obj).map(function (x) {
    if (this.circular) this.remove()
});
console.dir(scrubbed);
