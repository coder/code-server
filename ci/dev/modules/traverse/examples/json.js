var traverse = require('traverse');

var id = 54;
var callbacks = {};
var obj = { moo : function () {}, foo : [2,3,4, function () {}] };

var scrubbed = traverse(obj).map(function (x) {
    if (typeof x === 'function') {
        callbacks[id] = { id : id, f : x, path : this.path };
        this.update('[Function]');
        id++;
    }
});

console.dir(scrubbed);
console.dir(callbacks);
