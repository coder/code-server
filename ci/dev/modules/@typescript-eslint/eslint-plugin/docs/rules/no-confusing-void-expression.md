# Requires expressions of type void to appear in statement position (`no-confusing-void-expression`)

Returning the results of an expression whose type is void can be misleading.
Attempting to do so is likely a symptom of expecting a different return type from a function.
Even if used correctly, it can be misleading for other developers,
who don't know what a particular function does and if its result matters.

This rule provides automatic fixes for most common cases.

## Examples

Examples of **incorrect** code for this rule:

```ts
// somebody forgot that `alert` doesn't return anything
const response = alert('Are you sure?');
console.log(alert('Are you sure?'));

// it's not obvious whether the chained promise will contain the response (fixable)
promise.then(value => window.postMessage(value));

// it looks like we are returning the result of `console.error` (fixable)
function doSomething() {
  if (!somethingToDo) {
    return console.error('Nothing to do!');
  }

  console.log('Doing a thing...');
}
```

Examples of **correct** code for this rule:

```ts
// just a regular void function in a statement position
alert('Hello, world!');

// this function returns a boolean value so it's ok
const response = confirm('Are you sure?');
console.log(confirm('Are you sure?'));

// now it's obvious that `postMessage` doesn't return any response
promise.then(value => {
  window.postMessage(value);
});

// now it's explicit that we want to log the error and return early
function doSomething() {
  if (!somethingToDo) {
    console.error('Nothing to do!');
    return;
  }

  console.log('Doing a thing...');
}

// using logical expressions for their side effects is fine
cond && console.log('true');
cond || console.error('false');
cond ? console.log('true') : console.error('false');
```

## Options

An object option can be specified. Each boolean flag makes the rule less strict.

```ts
type Options = {
  ignoreArrowShorthand?: boolean;
  ignoreVoidOperator?: boolean;
};

const defaults: Options = {
  ignoreArrowShorthand: false,
  ignoreVoidOperator: false,
};
```

### `ignoreArrowShorthand`

`false` by default.

```json
{
  "@typescript-eslint/no-confusing-void-expression": [
    "error",
    { "ignoreArrowShorthand": true }
  ]
}
```

It might be undesirable to wrap every arrow function shorthand expression with braces.
Especially when using Prettier formatter, which spreads such code across 3 lines instead of 1.

Examples of additional **correct** code with this option enabled:

```ts
promise.then(value => window.postMessage(value));
```

### `ignoreVoidOperator`

`false` by default.

```json
{
  "@typescript-eslint/no-confusing-void-expression": [
    "error",
    { "ignoreVoidOperator": true }
  ]
}
```

It might be preferable to only use some distinct syntax
to explicitly mark the confusing but valid usage of void expressions.
This option allows void expressions which are explicitly wrapped in the `void` operator.
This can help avoid confusion among other developers as long as they are made aware of this code style.

This option also changes the automatic fixes for common cases to use the `void` operator.
It also enables a suggestion fix to wrap the void expression with `void` operator for every problem reported.

Examples of additional **correct** code with this option enabled:

```ts
// now it's obvious that we don't expect any response
promise.then(value => void window.postMessage(value));

// now it's explicit that we don't want to return anything
function doSomething() {
  if (!somethingToDo) {
    return void console.error('Nothing to do!');
  }

  console.log('Doing a thing...');
}

// we are sure that we want to always log `undefined`
console.log(void alert('Hello, world!'));
```

## When Not To Use It

The return type of a function can be inspected by going to its definition or hovering over it in an IDE.
If you don't care about being explicit about the void type in actual code then don't use this rule.
Also, if you prefer concise coding style then also don't use it.

## Related to

- TSLint: ['no-void-expression'](https://palantir.github.io/tslint/rules/no-void-expression/)
