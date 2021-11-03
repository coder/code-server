var test = require('tape');
var traverse = require('../');
var EventEmitter = require('events').EventEmitter;

test('check instanceof on node elems', function (t) {
    var counts = { emitter : 0 };
    
    traverse([ new EventEmitter, 3, 4, { ev : new EventEmitter }])
        .forEach(function (node) {
            if (node instanceof EventEmitter) counts.emitter ++;
        })
    ;
    
    t.equal(counts.emitter, 2);
    
    t.end();
});
