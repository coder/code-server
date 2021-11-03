# Requires that private members are marked as `readonly` if they're never modified outside of the constructor (`prefer-readonly`)

This rule enforces that private members are marked as `readonly` if they're never modified outside of the constructor.

## Rule Details

Member variables with the privacy `private` are never permitted to be modified outside of their declaring class.
If that class never modifies their value, they may safely be marked as `readonly`.

Examples of **incorrect** code for this rule:

```ts
class Container {
  // These member variables could be marked as readonly
  private neverModifiedMember = true;
  private onlyModifiedInConstructor: number;

  public constructor(
    onlyModifiedInConstructor: number,
    // Private parameter properties can also be marked as readonly
    private neverModifiedParameter: string,
  ) {
    this.onlyModifiedInConstructor = onlyModifiedInConstructor;
  }
}
```

Examples of **correct** code for this rule:

```ts
class Container {
  // Public members might be modified externally
  public publicMember: boolean;

  // Protected members might be modified by child classes
  protected protectedMember: number;

  // This is modified later on by the class
  private modifiedLater = 'unchanged';

  public mutate() {
    this.modifiedLater = 'mutated';
  }
}
```

## Options

This rule, in its default state, does not require any argument.

### `onlyInlineLambdas`

You may pass `"onlyInlineLambdas": true` as a rule option within an object to restrict checking only to members immediately assigned a lambda value.

```jsonc
{
  "@typescript-eslint/prefer-readonly": ["error", { "onlyInlineLambdas": true }]
}
```

Example of **correct** code for the `{ "onlyInlineLambdas": true }` options:

```ts
class Container {
  private neverModifiedPrivate = 'unchanged';
}
```

Example of **incorrect** code for the `{ "onlyInlineLambdas": true }` options:

```ts
class Container {
  private onClick = () => {
    /* ... */
  };
}
```

## Related to

- TSLint: ['prefer-readonly'](https://palantir.github.io/tslint/rules/prefer-readonly)
