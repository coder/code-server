# import/prefer-default-export

When there is only a single export from a module, prefer using default export over named export.

## Rule Details

The following patterns are considered warnings:

```javascript
// bad.js

// There is only a single module export and it's a named export.
export const foo = 'foo';

```

The following patterns are not warnings:

```javascript
// good1.js

// There is a default export.
export const foo = 'foo';
const bar = 'bar';
export default 'bar';
```

```javascript
// good2.js

// There is more than one named export in the module.
export const foo = 'foo';
export const bar = 'bar';
```

```javascript
// good3.js

// There is more than one named export in the module
const foo = 'foo';
const bar = 'bar';
export { foo, bar }
```

```javascript
// good4.js

// There is a default export.
const foo = 'foo';
export { foo as default }
```

```javascript
// export-star.js

// Any batch export will disable this rule. The remote module is not inspected.
export * from './other-module'
```
