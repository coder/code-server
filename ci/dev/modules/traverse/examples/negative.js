var traverse = require('traverse');
var obj = [ 5, 6, -3, [ 7, 8, -2, 1 ], { f : 10, g : -13 } ];

traverse(obj).forEach(function (x) {
    if (x < 0) this.update(x + 128);
});

console.dir(obj);
