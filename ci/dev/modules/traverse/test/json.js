var test = require('tape');
var traverse = require('../');

test('json test', function (t) {
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
    
    t.equal(
        scrubbed.moo, '[Function]',
        'obj.moo replaced with "[Function]"'
    );
    
    t.equal(
        scrubbed.foo[3], '[Function]',
        'obj.foo[3] replaced with "[Function]"'
    );
    
    t.same(scrubbed, {
        moo : '[Function]',
        foo : [ 2, 3, 4, "[Function]" ]
    }, 'Full JSON string matches');
    
    t.same(
        typeof obj.moo, 'function',
        'Original obj.moo still a function'
    );
    
    t.same(
        typeof obj.foo[3], 'function',
        'Original obj.foo[3] still a function'
    );
    
    t.same(callbacks, {
        54: { id: 54, f : obj.moo, path: [ 'moo' ] },
        55: { id: 55, f : obj.foo[3], path: [ 'foo', '3' ] },
    }, 'Check the generated callbacks list');
    
    t.end();
});

