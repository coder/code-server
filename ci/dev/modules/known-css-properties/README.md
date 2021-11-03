<p align="center"><img src="logo.png" width="200" height="200" alt="logo" /></p>

# Known CSS properties

List of standard and browser specific CSS properties.

[![License](https://img.shields.io/github/license/known-css/known-css-properties.svg)](https://github.com/known-css/known-css-properties/blob/master/LICENSE)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovateapp.com/)
[![Npm downloads](https://img.shields.io/npm/dm/known-css-properties.svg)](https://www.npmjs.com/package/known-css-properties)

## Sources

1. Standard properties (only 'REC', 'CR', 'LC', 'WD', 'FPWD', 'ED' statuses): http://www.w3.org/Style/CSS/all-properties.en.json
2. Browser supported properties from `window.getComputedStyle` / `document.body.style`

## Browser versions

### Desktop

| Name | Versions |
|---|--:|
| Chrome | 14 - 88 |
| Firefox | 6 - 85 |
| Edge | 13 - 18 |
| Safari | 6, 6.2, 7 - 9, 9.1, 10.0, 11.0, 11.1, 12.0, 12.1, 13.0, 13.1, 14, 14.4 |
| Internet Explorer | 8 - 11 |
| Opera | 12.10, 12.14, 12.15, 12.16, 36 - 40, 45, 56, 58 |

### Mobile
| Name | Versions |
|---|--:|
| iOS Safari | 6 - 8, 8.3, 9.0, 9.3, 10.0, 10.2, 10.3, 11.0, 11.2, 11.3, 11.4, 12.0 , 12.1, 13.1, 14 |
| Chrome for Android | 30, 35, 37, 44, 46, 51, 55 - 62, 64, 66 - 76, 78 - 79, 81, 83 |
| Firefox for Android | 47, 52 - 54, 57, 58, 62 - 64, 66, 68, 81, 85 |
| IE mobile | 11 |
| Opera Mobile | 42.7, 43, 47.1 |
| Samsung Internet | 4.0, 6.4, 7.4, 8.2 |
| UC Browser for Android | 11.2, 12.9, 13.1 |

## JavaScript API

```js
const properties = require('known-css-properties').all;
```

## Thanks

We use [SauceLabs](https://saucelabs.com) live testing solution for gathering most of the data.
