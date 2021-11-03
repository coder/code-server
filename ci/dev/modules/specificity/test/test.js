import { describe, it } from 'mocha';
import assert from 'assert';
import { calculate, compare } from '../specificity';

describe('calculate', () => {
	[
		// http://css-tricks.com/specifics-on-css-specificity/
		{ selector: 'ul#nav li.active a', expected: '0,1,1,3' },
		{ selector: 'body.ie7 .col_3 h2 ~ h2', expected: '0,0,2,3' },
		{ selector: '#footer *:not(nav) li', expected: '0,1,0,2' },
		{ selector: 'ul > li ul li ol li:first-letter', expected: '0,0,0,7' },

		// http://reference.sitepoint.com/css/specificity
		{ selector: 'body#home div#warning p.message', expected: '0,2,1,3' },
		{ selector: '* body#home>div#warning p.message', expected: '0,2,1,3' },
		{ selector: '#home #warning p.message', expected: '0,2,1,1' },
		{ selector: '#warning p.message', expected: '0,1,1,1' },
		{ selector: '#warning p', expected: '0,1,0,1' },
		{ selector: 'p.message', expected: '0,0,1,1' },
		{ selector: 'p', expected: '0,0,0,1' },

		// Test pseudo-element with uppertestCase letters
		{ selector: 'li:bEfoRE', expected: '0,0,0,2' },

		// Pseudo-class tests
		{ selector: 'li:first-child+p', expected: '0,0,1,2'},
		{ selector: 'li:nth-child(even)+p', expected: '0,0,1,2'},
		{ selector: 'li:nth-child(2n+1)+p', expected: '0,0,1,2'},
		{ selector: 'li:nth-child( 2n + 1 )+p', expected: '0,0,1,2'},
		{ selector: 'li:nth-child(2n-1)+p', expected: '0,0,1,2'},
		{ selector: 'li:nth-child(2n-1) p', expected: '0,0,1,2'},
		{ selector: ':lang(nl-be)', expected: '0,0,1,0'},

		// Tests with CSS escape sequences
		// https://mathiasbynens.be/notes/css-escapes and https://mathiasbynens.be/demo/crazy-class
		{ selector: '.\\3A -\\)', expected: '0,0,1,0' },             /* <p class=":-)"></p> */
		{ selector: '.\\3A \\`\\(', expected: '0,0,1,0' },           /* <p class=":`("></p> */
		{ selector: '.\\3A .\\`\\(', expected: '0,0,2,0' },          /* <p class=": `("></p> */
		{ selector: '.\\31 a2b3c', expected: '0,0,1,0' },            /* <p class="1a2b3c"></p> */
		{ selector: '.\\000031a2b3c', expected: '0,0,1,0' },         /* <p class="1a2b3c"></p> */
		{ selector: '.\\000031 a2b3c', expected: '0,0,1,0' },        /* <p class="1a2b3c"></p> */
		{ selector: '#\\#fake-id', expected: '0,1,0,0' },            /* <p id="#fake-id"></p> */
		{ selector: '.\\#fake-id', expected: '0,0,1,0' },            /* <p class="#fake-id"></p> */
		{ selector: '#\\<p\\>', expected: '0,1,0,0' },               /* <p id="<p>"></p> */
		{ selector: '.\\#\\.\\#\\.\\#', expected: '0,0,1,0' },       /* <p class="#.#.#"></p> */
		{ selector: '.foo\\.bar', expected: '0,0,1,0' },             /* <p class="foo.bar"></p> */
		{ selector: '.\\:hover\\:active', expected: '0,0,1,0' },     /* <p class=":hover:active"></p> */
		{ selector: '.\\3A hover\\3A active', expected: '0,0,1,0' }, /* <p class=":hover:active"></p> */
		{ selector: '.\\000031  p', expected: '0,0,1,1' },           /* <p class="1"><p></p></p>" */
		{ selector: '.\\3A \\`\\( .another', expected: '0,0,2,0' },  /* <p class=":`("><p class="another"></p></p> */
		{ selector: '.\\--cool', expected: '0,0,1,0' },              /* <p class="--cool"></p> */
		{ selector: '#home .\\[page\\]', expected: '0,1,1,0' },      /* <p id="home"><p class="[page]"></p></p> */

		// Test repeated IDs
		// https://github.com/keeganstreet/specificity/issues/29
		{ selector: 'ul#nav#nav-main li.active a', expected: '0,2,1,3' },

		// Test CSS Modules https://github.com/css-modules/css-modules
		// Whilst they are not part of the CSS spec, this calculator can support them without breaking results for standard selectors
		{ selector: '.root :global .text', expected: '0,0,2,0' },
		{ selector: '.localA :global .global-b :local(.local-c) .global-d', expected: '0,0,4,0' },
		{ selector: '.localA :global .global-b .global-c :local(.localD.localE) .global-d', expected: '0,0,6,0' },
		{ selector: '.localA :global(.global-b) .local-b', expected: '0,0,3,0' },
		{ selector: ':local(:nth-child(2n) .test)', expected: '0,0,2,0' },
		
	].forEach(testCase => {
		it(`calculate("${testCase.selector}")`, () => {
			const result = calculate(testCase.selector);
			assert.equal(result[0].specificity, testCase.expected);
		});
	});
});

describe('compare', () => {
	[
		{ a: 'div', b: 'span', expected: 0 },
		{ a: '.active', b: ':focus', expected: 0 },
		{ a: '#header', b: '#main', expected: 0 },
		{ a: 'div', b: '.active', expected: -1 },
		{ a: 'div', b: '#header', expected: -1 },
		{ a: '.active', b: '#header', expected: -1 },
		{ a: '.active', b: 'div', expected: 1 },
		{ a: '#main', b: 'div', expected: 1 },
		{ a: '#main', b: ':focus', expected: 1 },
		{ a: 'div p', b: 'span a', expected: 0 },
		{ a: '#main p .active', b: '#main span :focus', expected: 0 },
		{ a: [0, 1, 1, 1], b: '#main span :focus', expected: 0 },
		{ a: '#main p .active', b: [0, 1, 1, 1], expected: 0 },
		{ a: ':focus', b: 'span a', expected: 1 },
		{ a: '#main', b: 'span a:hover', expected: 1 },
		{ a: 'ul > li > a > span:before', b: '.active', expected: -1 },
		{ a: 'a.active:hover', b: '#main', expected: -1 },
	].forEach(testCase => {
		it(`compare("${testCase.a}", "${testCase.b}")`, () => {
			const result = compare(testCase.a, testCase.b);
			assert.equal(result, testCase.expected);
		});
	});
});

describe('sorting with compare', () => {
	const a = 'div';
	const b = 'p a';
	const c = '.active';
	const d = 'p.active';
	const e = '.active:focus';
	const f = '#main';
	const original = [c, f, a, e, b, d];
	const sorted = [a, b, c, d, e, f];
	const result = original.sort(compare);

	it('Array.sort(compare) should sort the array by specificity', () => {
		assert.equal(result.join('|'), sorted.join('|'));
	});
});
