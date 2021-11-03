# no-irregular-whitespace

Disallow irregular whitespaces.

<!-- prettier-ignore -->
```css
    .firstClass .secondClass {}
/**            ↑
 * Irregular whitespace. Selector would fail to match '.firstClass' */
```

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
.firstClass .secondClass {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
.firstClass .secondClass { /* Writing comments with irregular whitespaces */ }
```

## Unicode reference of irregular whitespaces

```
\u000B - Line Tabulation (\v) - <VT>
\u000C - Form Feed (\f) - <FF>
\u00A0 - No-Break Space - <NBSP>
\u0085 - Next Line
\u1680 - Ogham Space Mark
\u180E - Mongolian Vowel Separator - <MVS>
\uFEFF - Zero Width No-Break Space - <BOM>
\u2000 - En Quad
\u2001 - Em Quad
\u2002 - En Space - <ENSP>
\u2003 - Em Space - <EMSP>
\u2004 - Tree-Per-Em
\u2005 - Four-Per-Em
\u2006 - Six-Per-Em
\u2007 - Figure Space
\u2008 - Punctuation Space - <PUNCSP>
\u2009 - Thin Space
\u200A - Hair Space
\u200B - Zero Width Space - <ZWSP>
\u2028 - Line Separator
\u2029 - Paragraph Separator
\u202F - Narrow No-Break Space
\u205F - Medium Mathematical Space
\u3000 - Ideographic Space
```
