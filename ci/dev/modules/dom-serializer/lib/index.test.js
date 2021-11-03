"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio_1 = __importDefault(require("cheerio"));
// @ts-expect-error Module does not have types for now
var parse_1 = __importDefault(require("cheerio/lib/parse"));
var index_1 = __importDefault(require("./index"));
var defaultOpts = cheerio_1.default.prototype.options;
function html(preset, str, options) {
    if (options === void 0) { options = {}; }
    var opts = __assign(__assign(__assign({}, defaultOpts), preset), options);
    var dom = parse_1.default(str, opts);
    return index_1.default(dom, opts);
}
function xml(str, options) {
    if (options === void 0) { options = {}; }
    var opts = __assign(__assign(__assign({}, defaultOpts), options), { xmlMode: true });
    var dom = parse_1.default(str, opts);
    return index_1.default(dom, opts);
}
describe("render DOM parsed with htmlparser2", function () {
    // Only test applicable to the default setup
    describe("(html)", function () {
        var htmlFunc = html.bind(null, { _useHtmlParser2: true });
        /*
         * It doesn't really make sense for {decodeEntities: false}
         * since currently it will convert <hr class='blah'> into <hr class="blah"> anyway.
         */
        it("should handle double quotes within single quoted attributes properly", function () {
            var str = "<hr class='an \"edge\" case' />";
            expect(htmlFunc(str)).toStrictEqual('<hr class="an &quot;edge&quot; case">');
        });
    });
    // Run html with default options
    describe("(html, {})", testBody.bind(null, html.bind(null, { _useHtmlParser2: true })));
    // Run html with turned off decodeEntities
    describe("(html, {decodeEntities: false})", testBody.bind(null, html.bind(null, { _useHtmlParser2: true, decodeEntities: false })));
    describe("(xml)", function () {
        it("should render CDATA correctly", function () {
            var str = "<a> <b> <![CDATA[ asdf&asdf ]]> <c/> <![CDATA[ asdf&asdf ]]> </b> </a>";
            expect(xml(str)).toStrictEqual(str);
        });
        it('should append ="" to attributes with no value', function () {
            var str = "<div dropdown-toggle>";
            expect(xml(str)).toStrictEqual('<div dropdown-toggle=""/>');
        });
        it('should append ="" to boolean attributes with no value', function () {
            var str = "<input disabled>";
            expect(xml(str)).toStrictEqual('<input disabled=""/>');
        });
        it("should preserve XML prefixes on attributes", function () {
            var str = '<div xmlns:ex="http://example.com/ns"><p ex:ample="attribute">text</p></div>';
            expect(xml(str)).toStrictEqual(str);
        });
        it("should preserve mixed-case XML elements and attributes", function () {
            var str = '<svg viewBox="0 0 8 8"><radialGradient/></svg>';
            expect(xml(str)).toStrictEqual(str);
        });
    });
});
describe("(xml, {selfClosingTags: false})", function () {
    it("should render childless nodes with an explicit closing tag", function () {
        var str = "<foo /><bar></bar>";
        expect(xml(str, { selfClosingTags: false })).toStrictEqual("<foo></foo><bar></bar>");
    });
});
describe("(html, {selfClosingTags: true})", function () {
    it("should render <br /> tags correctly", function () {
        var str = "<br />";
        expect(html({
            _useHtmlParser2: true,
            decodeEntities: false,
            selfClosingTags: true,
        }, str)).toStrictEqual(str);
    });
});
describe("(html, {selfClosingTags: false})", function () {
    it("should render childless SVG nodes with an explicit closing tag", function () {
        var str = '<svg><circle x="12" y="12"></circle><path d="123M"></path><polygon points="60,20 100,40 100,80 60,100 20,80 20,40"></polygon></svg>';
        expect(html({
            _useHtmlParser2: true,
            decodeEntities: false,
            selfClosingTags: false,
        }, str)).toStrictEqual(str);
    });
});
function testBody(html) {
    it("should render <br /> tags without a slash", function () {
        var str = "<br />";
        expect(html(str)).toStrictEqual("<br>");
    });
    it("should retain encoded HTML content within attributes", function () {
        var str = '<hr class="cheerio &amp; node = happy parsing" />';
        expect(html(str)).toStrictEqual('<hr class="cheerio &amp; node = happy parsing">');
    });
    it('should shorten the "checked" attribute when it contains the value "checked"', function () {
        var str = "<input checked/>";
        expect(html(str)).toStrictEqual("<input checked>");
    });
    it("should render empty attributes if asked for", function () {
        var str = "<input checked/>";
        expect(html(str, { emptyAttrs: true })).toStrictEqual('<input checked="">');
    });
    it('should not shorten the "name" attribute when it contains the value "name"', function () {
        var str = '<input name="name"/>';
        expect(html(str)).toStrictEqual('<input name="name">');
    });
    it('should not append ="" to attributes with no value', function () {
        var str = "<div dropdown-toggle>";
        expect(html(str)).toStrictEqual("<div dropdown-toggle></div>");
    });
    it("should render comments correctly", function () {
        var str = "<!-- comment -->";
        expect(html(str)).toStrictEqual("<!-- comment -->");
    });
    it("should render whitespace by default", function () {
        var str = '<a href="./haha.html">hi</a> <a href="./blah.html">blah</a>';
        expect(html(str)).toStrictEqual(str);
    });
    it("should normalize whitespace if specified", function () {
        var str = '<a href="./haha.html">hi</a> <a href="./blah.html">blah  </a>';
        expect(html(str, { normalizeWhitespace: true })).toStrictEqual('<a href="./haha.html">hi</a> <a href="./blah.html">blah </a>');
    });
    it("should preserve multiple hyphens in data attributes", function () {
        var str = '<div data-foo-bar-baz="value"></div>';
        expect(html(str)).toStrictEqual('<div data-foo-bar-baz="value"></div>');
    });
    it("should not encode characters in script tag", function () {
        var str = '<script>alert("hello world")</script>';
        expect(html(str)).toStrictEqual(str);
    });
    it("should not encode json data", function () {
        var str = '<script>var json = {"simple_value": "value", "value_with_tokens": "&quot;here & \'there\'&quot;"};</script>';
        expect(html(str)).toStrictEqual(str);
    });
    it("should render childless SVG nodes with a closing slash in HTML mode", function () {
        var str = '<svg><circle x="12" y="12"/><path d="123M"/><polygon points="60,20 100,40 100,80 60,100 20,80 20,40"/></svg>';
        expect(html(str)).toStrictEqual(str);
    });
    it("should render childless MathML nodes with a closing slash in HTML mode", function () {
        var str = "<math><infinity/></math>";
        expect(html(str)).toStrictEqual(str);
    });
    it("should allow SVG elements to have children", function () {
        var str = '<svg><circle cx="12" r="12"><title>dot</title></circle></svg>';
        expect(html(str)).toStrictEqual(str);
    });
    it("should not include extra whitespace in SVG self-closed elements", function () {
        var str = '<svg><image href="x.png"/>     </svg>';
        expect(html(str)).toStrictEqual(str);
    });
    it("should fix-up bad nesting in SVG in HTML mode", function () {
        var str = '<svg><g><image href="x.png"></svg>';
        expect(html(str)).toStrictEqual('<svg><g><image href="x.png"/></g></svg>');
    });
    it("should preserve XML prefixed attributes on inline SVG nodes in HTML mode", function () {
        var str = '<svg><text id="t" xml:lang="fr">Bonjour</text><use xlink:href="#t"/></svg>';
        expect(html(str)).toStrictEqual(str);
    });
    it("should handle mixed-case SVG content in HTML mode", function () {
        var str = '<svg viewBox="0 0 8 8"><radialGradient/></svg>';
        expect(html(str)).toStrictEqual(str);
    });
    it("should render HTML content in SVG foreignObject in HTML mode", function () {
        var str = '<svg><foreignObject requiredFeatures=""><img src="test.png" viewbox>text<svg viewBox="0 0 8 8"><circle r="3"/></svg></foreignObject></svg>';
        expect(html(str)).toStrictEqual(str);
    });
    it("should render iframe nodes with a closing tag in HTML mode", function () {
        var str = '<iframe src="test"></iframe>';
        expect(html(str)).toStrictEqual(str);
    });
}
