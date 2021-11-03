var test = require('tape');
var traverse = require('../');

test('sort test', function (t) {
    var acc = [];
    traverse({
        a: 30,
        b: 22,
        id: 9
    }).forEach(function (node) {
        if ((! Array.isArray(node)) && typeof node === 'object') {
            this.before(function(node) {
                this.keys = Object.keys(node);
                this.keys.sort(function(a, b) {
                    a = [a === "id" ? 0 : 1, a];
                    b = [b === "id" ? 0 : 1, b];
                    return a < b ? -1 : a > b ? 1 : 0;
                });
            });
        }
        if (this.isLeaf) acc.push(node);
    });
    
    t.equal(
        acc.join(' '),
        '9 30 22',
        'Traversal in a custom order'
    );
    
    t.end();
});
