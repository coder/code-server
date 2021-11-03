# update-section [![build status](https://secure.travis-ci.org/thlorenz/update-section.png)](http://travis-ci.org/thlorenz/update-section)

[![testling badge](https://ci.testling.com/thlorenz/update-section.png)](https://ci.testling.com/thlorenz/update-section)

Updates a section inside a file with newer content while removing the old content.

```js
var updateSection = require('update-section');

var original = [
    '# Some Project'
  , ''
  , 'Does a bunch of things'
  , ''
  , 'START -- GENERATED GOODNESS'
  , 'this was painstakingly generated'
  , 'as was this'
  , 'END -- GENERATED GOODNESS' , ''
  , ''
  , '## The End'
  , ''
  , 'Til next time'
].join('\n');

var update = [
    'START -- GENERATED GOODNESS'
  , 'this was painstakingly re-generated'
  , 'and we added another line'
  , 'here'
  , 'END -- GENERATED GOODNESS'
].join('\n');

function matchesStart(line) {
  return (/START -- GENERATED GOODNESS/).test(line);  
}

function matchesEnd(line) {
  return (/END -- GENERATED GOODNESS/).test(line);  
}

var updated = updateSection(original, update, matchesStart, matchesEnd);
console.log(updated);
```

#### Output
```
# Some Project

Does a bunch of things

START -- GENERATED GOODNESS
this was painstakingly re-generated
and we added another line
here
END -- GENERATED GOODNESS

## The End

Til next time
```

## Installation

    npm install update-section

## API

### updateSection(content, section, matchesStart, matchesEnd)

```
/**
 * Updates the content with the given section. 
 *
 * If previous section is found it is replaced.
 * Otherwise the section is appended to the end of the content.
 *
 * @name updateSection
 * @function
 * @param {String} content that may or may not include a previously added section
 * @param {String} section the section to update
 * @param {Function} matchesStart when called with a line needs to return true iff it is the section start line
 * @param {Function} matchesEnd when called with a line needs to return true iff it is the section end line
 * @return {String} content with updated section
 */
```

## License

MIT


<!-- START docme generated API please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN docme TO UPDATE -->

<div>
<div class="jsdoc-githubify">
<section>
<article>
<div class="container-overview">
<dl class="details">
</dl>
</div>
<dl>
<dt>
<h4 class="name" id="updateSection"><span class="type-signature"></span>updateSection<span class="signature">(content, section, matchesStart, matchesEnd, top)</span><span class="type-signature"> &rarr; {String}</span></h4>
</dt>
<dd>
<div class="description">
<p>Updates the content with the given section. </p>
<p>If previous section is found it is replaced.
Otherwise the section is appended to the end of the content.</p>
</div>
<h5>Parameters:</h5>
<table class="params">
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th class="last">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td class="name"><code>content</code></td>
<td class="type">
<span class="param-type">String</span>
</td>
<td class="description last"><p>that may or may not include a previously added section</p></td>
</tr>
<tr>
<td class="name"><code>section</code></td>
<td class="type">
<span class="param-type">String</span>
</td>
<td class="description last"><p>the section to update</p></td>
</tr>
<tr>
<td class="name"><code>matchesStart</code></td>
<td class="type">
<span class="param-type">function</span>
</td>
<td class="description last"><p>when called with a line needs to return true iff it is the section start line</p></td>
</tr>
<tr>
<td class="name"><code>matchesEnd</code></td>
<td class="type">
<span class="param-type">function</span>
</td>
<td class="description last"><p>when called with a line needs to return true iff it is the section end line</p></td>
</tr>
<tr>
<td class="name"><code>top</code></td>
<td class="type">
<span class="param-type">boolean</span>
</td>
<td class="description last"><p>forces the section to be added at the top of the content if a replacement couldn't be made</p></td>
</tr>
</tbody>
</table>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/thlorenz/update-section/blob/master/update-section.js">update-section.js</a>
<span>, </span>
<a href="https://github.com/thlorenz/update-section/blob/master/update-section.js#L44">lineno 44</a>
</li>
</ul></dd>
</dl>
<h5>Returns:</h5>
<div class="param-desc">
<p>content with updated section</p>
</div>
<dl>
<dt>
Type
</dt>
<dd>
<span class="param-type">String</span>
</dd>
</dl>
</dd>
<dt>
<h4 class="name" id="updateSection::parse"><span class="type-signature"></span>updateSection::parse<span class="signature">(lines, matchesStart, matchesEnd)</span><span class="type-signature"> &rarr; {object}</span></h4>
</dt>
<dd>
<div class="description">
<p>Finds the start and end lines that match the given criteria.
Used by update-section itself.</p>
<p>Use it if you need to get information about where the matching content is located.</p>
</div>
<h5>Parameters:</h5>
<table class="params">
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th class="last">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td class="name"><code>lines</code></td>
<td class="type">
<span class="param-type">Array.&lt;string></span>
</td>
<td class="description last"><p>the lines in which to look for matches</p></td>
</tr>
<tr>
<td class="name"><code>matchesStart</code></td>
<td class="type">
<span class="param-type">function</span>
</td>
<td class="description last"><p>when called with a line needs to return true iff it is the section start line</p></td>
</tr>
<tr>
<td class="name"><code>matchesEnd</code></td>
<td class="type">
<span class="param-type">function</span>
</td>
<td class="description last"><p>when called with a line needs to return true iff it is the section end line</p></td>
</tr>
</tbody>
</table>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/thlorenz/update-section/blob/master/update-section.js">update-section.js</a>
<span>, </span>
<a href="https://github.com/thlorenz/update-section/blob/master/update-section.js#L3">lineno 3</a>
</li>
</ul></dd>
</dl>
<h5>Returns:</h5>
<div class="param-desc">
<p>with the following properties: hasStart, hasEnd, startIdx, endIdx</p>
</div>
<dl>
<dt>
Type
</dt>
<dd>
<span class="param-type">object</span>
</dd>
</dl>
</dd>
</dl>
</article>
</section>
</div>

*generated with [docme](https://github.com/thlorenz/docme)*
</div>
<!-- END docme generated API please keep comment here to allow auto update -->