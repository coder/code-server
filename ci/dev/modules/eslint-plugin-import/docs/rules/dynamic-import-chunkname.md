# dynamic imports require a leading comment with a webpackChunkName (dynamic-import-chunkname)

This rule reports any dynamic imports without a webpackChunkName specified in a leading block comment in the proper format.

This rule enforces naming of webpack chunks in dynamic imports. When you don't explicitly name chunks, webpack will autogenerate chunk names that are not consistent across builds, which prevents long-term browser caching.

## Rule Details
This rule runs against `import()` by default, but can be configured to also run against an alternative dynamic-import function, e.g. 'dynamicImport.'
You can also configure the regex format you'd like to accept for the webpackChunkName - for example, if we don't want the number 6 to show up in our chunk names:
 ```javascript
{
  "dynamic-import-chunkname": [2, {
    importFunctions: ["dynamicImport"],
    webpackChunknameFormat: "[a-zA-Z0-57-9-/_]+"
  }]
}
```

### invalid
The following patterns are invalid:

```javascript
// no leading comment
import('someModule');

// incorrectly formatted comment
import(
  /*webpackChunkName:"someModule"*/
  'someModule',
);
import(
  /* webpackChunkName : "someModule" */
  'someModule',
);

// chunkname contains a 6 (forbidden by rule config)
import(
  /* webpackChunkName: "someModule6" */
  'someModule',
);

// invalid syntax for webpack comment
import(
  /* totally not webpackChunkName: "someModule" */
  'someModule',
);

// single-line comment, not a block-style comment
import(
  // webpackChunkName: "someModule"
  'someModule',
);
```
### valid
The following patterns are valid:

```javascript
  import(
    /* webpackChunkName: "someModule" */
    'someModule',
  );
  import(
    /* webpackChunkName: "someOtherModule12345789" */
    'someModule',
  );
  import(
    /* webpackChunkName: "someModule" */
    /* webpackPrefetch: true */
    'someModule',
  );
  import(
    /* webpackChunkName: "someModule", webpackPrefetch: true */
    'someModule',
  );

  // using single quotes instead of double quotes
  import(
    /* webpackChunkName: 'someModule' */
    'someModule',
  );
```

## When Not To Use It

If you don't care that webpack will autogenerate chunk names and may blow up browser caches and bundle size reports.
