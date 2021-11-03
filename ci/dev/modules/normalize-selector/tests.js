var normalize = require("./lib/normalize-selector.js");

var tests = {
	/*test*/"#foo .bar":
	   /*expected*/"#foo .bar",
	/*test*/" #foo   .bar ":
	   /*expected*/"#foo .bar",
	/*test*/"#foo>.bar":
	   /*expected*/"#foo > .bar",
	/*test*/" unit[ sh | quantity = \"200\" ] ":
	   /*expected*/"unit[sh|quantity=\"200\"]",
	/*test*/"*~*>*.foo[ href *= \"/\" ]:hover>*[ data-foo = \"bar\" ]:focus+*.baz::after":
	   /*expected*/"* ~ * > *.foo[href*=\"/\"]:hover > *[data-foo=\"bar\"]:focus + *.baz::after",
	/*test*/"@media  screen  and  ( color ),  projection  and  ( color )":
	   /*expected*/"@media screen and (color), projection and (color)",
	/*test*/"@media  handheld  and  ( min-width : 20em ),   screen  and  ( min-width: 20em )":
	   /*expected*/"@media handheld and (min-width:20em), screen and (min-width:20em)",
	/*test*/"@media  screen  and  ( device-aspect-ratio : 2560 / 1440 )":
	   /*expected*/"@media screen and (device-aspect-ratio:2560/1440)",
	/*test*/"((a ) (b(c ) ) d )>*[ data-foo = \"bar\" ]":
	   /*expected*/"((a)(b(c))d) > *[data-foo=\"bar\"]",
	/*test*/"#foo[ a = \" b \\\" c\\\\\" ]":
	   /*expected*/"#foo[a=\" b \\\" c\\\\\"]",
	/*test*/"#foo[  a  =  \"b\"  i  ]":
	   /*expected*/"#foo[a=\"b\" i]",
	/*test*/" /*c1*/ .e1/*c2*/.e2 /*c3*/ .e3 /*c4*/ ":
	   /*expected*/".e1 .e2 .e3",
	/*test*/" /*c1*/ .e1/*c2*/.e2 /*c3*/ .e3 ":
	   /*expected*/".e1 .e2 .e3",
	/*test*/" /*c1*/ .e1/*c2*/.e2 /*c3*/ .e3":
	   /*expected*/".e1 .e2 .e3",
	/*test*/"/*c1*/.e1/*c2*/.e2 /*c3*/ .e3":
	   /*expected*/".e1 .e2 .e3",
	/*test*/".e1/*c2*/.e2 /*c3*/ .e3":
	   /*expected*/".e1 .e2 .e3"
};

var test, tmp;
for (test in tests) {
	if ((tmp = normalize(test)) && tmp === tests[test]) {
		console.log("PASSED: " + test + " (" + tmp + ")");
	}
	else {
		console.log("FAILED.\n Expected: " + tests[test] + "\n Received: " + tmp);
		break;
	}
}

console.log("Tests done.");
