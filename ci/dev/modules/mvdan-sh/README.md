## mvdan-sh

This package is a JavaScript version of a shell package written in Go, available
at https://github.com/mvdan/sh.

It is transpiled from Go to JS using a GopherJS fork, available at
https://github.com/myitcv/gopherjs.

### Sample usage

```
const sh = require('mvdan-sh')
const syntax = sh.syntax

var parser = syntax.NewParser()
var printer = syntax.NewPrinter()

var src = "echo 'foo'"
var f = parser.Parse(src, "src.sh")

// print out the syntax tree
syntax.DebugPrint(f)
console.log()

// replace all single quoted string values
syntax.Walk(f, function(node) {
        if (syntax.NodeType(node) == "SglQuoted") {
                node.Value = "bar"
        }
        return true
})

// print the code back out
console.log(printer.Print(f)) // echo 'bar'
```

You can find more samples in
[testmain.js](https://github.com/mvdan/sh/blob/master/_js/testmain.js).

### Available APIs

The APIs listed below are wrapped to be usable in JavaScript. Follow the links
to read their documentation.

* [syntax.NewParser](https://godoc.org/mvdan.cc/sh/syntax#NewParser)
  - [Parser.Parse](https://godoc.org/mvdan.cc/sh/syntax#Parser.Parse)
  - [Parser.Interactive](https://godoc.org/mvdan.cc/sh/syntax#Parser.Interactive)
  - [Parser.Incomplete](https://godoc.org/mvdan.cc/sh/syntax#Parser.Incomplete)
* [syntax.DebugPrint](https://godoc.org/mvdan.cc/sh/syntax#DebugPrint)
* [syntax.Walk](https://godoc.org/mvdan.cc/sh/syntax#Walk)
* [syntax.NewPrinter](https://godoc.org/mvdan.cc/sh/syntax#NewPrinter)
  - [Printer.Print](https://godoc.org/mvdan.cc/sh/syntax#Printer.Print)

Constructor options like
[syntax.KeepComments](https://godoc.org/mvdan.cc/sh/syntax#KeepComments) are
also available.

The original `io.Reader` parameters can take a string or a
[stream.Readable](https://nodejs.org/api/stream.html#stream_class_stream_readable)
object. `io.Writer` parameters are replaced by string returns.

The nodes you will find in the syntax tree are all equivalent to the nodes you
will see on the Go API. To get the type of a node, use `syntax.NodeType` as the
example above shows. Some of the most common node types include:

* [syntax.File](https://godoc.org/mvdan.cc/sh/syntax#File)
* [syntax.Stmt](https://godoc.org/mvdan.cc/sh/syntax#Stmt)
* [syntax.CallExpr](https://godoc.org/mvdan.cc/sh/syntax#CallExpr)
* [syntax.Word](https://godoc.org/mvdan.cc/sh/syntax#Word)
* [syntax.Lit](https://godoc.org/mvdan.cc/sh/syntax#Lit)

The five above will show up in your syntax tree if you parse a `echo foo`
command, which you can see if you use `syntax.DebugPrint` to inspect the syntax
tree.

### Building

You will need:

* Latest Go 1.11.x
* Latest `gopherjs` from @myitcv's fork: https://github.com/myitcv/gopherjs
* NodeJS, to run the `testmain.js` test suite

Then, simply run `./build`. The result will be `index.js`, which isn't minified.
At the time of writing, `index.js` weighs 1.7MiB in plaintext, and 220KiB when
minified and gzipped.
