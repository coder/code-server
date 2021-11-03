# Require a consistent member declaration order (`member-ordering`)

A consistent ordering of fields, methods and constructors can make interfaces, type literals, classes and class expressions easier to read, navigate and edit.

## Rule Details

This rule aims to standardize the way class declarations, class expressions, interfaces and type literals are structured and ordered.

### Grouping and sorting member groups

It allows to group members by their type (e.g. `public-static-field`, `protected-static-field`, `private-static-field`, `public-instance-field`, ...) and enforce a certain order for these groups. By default, their order is the same inside `classes`, `classExpressions`, `interfaces` and `typeLiterals` (note: not all member types apply to `interfaces` and `typeLiterals`). It is possible to define the order for any of those individually or to change the default order for all of them by setting the `default` option.

### Sorting members

Besides grouping the members and sorting their groups, this rule also allows to sort the members themselves (e.g. `a`, `b`, `c`, ...). You have 2 options: Sort all of them while ignoring their type or sort them while respecting their types (e.g. sort all fields in an interface alphabetically).

## Options

These options allow to specify how to group the members and sort their groups.

- Sort groups, don't enforce member order: Use `memberTypes`
- Sort members, don't enforce group order: Use `order`
- Sort members within groups: Use `memberTypes` and `order`

```ts
type TypeOptions<T> =
  | {
    memberTypes: Array<T> | 'never',
    order?: 'alphabetically' | 'as-written',
  }
  | {
    order: 'alphabetically',
  };

{
  default?: TypeOptions<MemberTypes>,

  classes?: TypeOptions<MemberTypes>,
  classExpressions?: TypeOptions<MemberTypes>,

  interfaces?: TypeOptions<'signature' | 'field' | 'method' | 'constructor'>,
  typeLiterals?: TypeOptions<'signature' | 'field' | 'method' | 'constructor'>,
}
```

See below for the possible definitions of `MemberType`.

### Deprecated syntax

Note: There is a deprecated syntax to specify the member types as an array.

### Member types (granular form)

There are multiple ways to specify the member types. The most explicit and granular form is the following:

```jsonc
[
  // Index signature
  "signature",

  // Fields
  "public-static-field",
  "protected-static-field",
  "private-static-field",
  "public-decorated-field",
  "protected-decorated-field",
  "private-decorated-field",
  "public-instance-field",
  "protected-instance-field",
  "private-instance-field",
  "public-abstract-field",
  "protected-abstract-field",
  "private-abstract-field",

  // Constructors
  "public-constructor",
  "protected-constructor",
  "private-constructor",

  // Methods
  "public-static-method",
  "protected-static-method",
  "private-static-method",
  "public-decorated-method",
  "protected-decorated-method",
  "private-decorated-method",
  "public-instance-method",
  "protected-instance-method",
  "private-instance-method",
  "public-abstract-method",
  "protected-abstract-method",
  "private-abstract-method"
]
```

Note: If you only specify some of the possible types, the non-specified ones can have any particular order. This means that they can be placed before, within or after the specified types and the linter won't complain about it.

### Member group types (with accessibility, ignoring scope)

It is also possible to group member types by their accessibility (`static`, `instance`, `abstract`), ignoring their scope.

```jsonc
[
  // Index signature
  // No accessibility for index signature. See above.

  // Fields
  "public-field", // = ["public-static-field", "public-instance-field"]
  "protected-field", // = ["protected-static-field", "protected-instance-field"]
  "private-field", // = ["private-static-field", "private-instance-field"]

  // Constructors
  // Only the accessibility of constructors is configurable. See below.

  // Methods
  "public-method", // = ["public-static-method", "public-instance-method"]
  "protected-method", // = ["protected-static-method", "protected-instance-method"]
  "private-method" // = ["private-static-method", "private-instance-method"]
]
```

### Member group types (with accessibility and a decorator)

It is also possible to group methods or fields with a decorator separately, optionally specifying
their accessibility.

```jsonc
[
  // Index signature
  // No decorators for index signature.

  // Fields
  "public-decorated-field",
  "protected-decorated-field",
  "private-decorated-field",

  "decorated-field", // = ["public-decorated-field", "protected-decorated-field", "private-decorated-field"]

  // Constructors
  // There are no decorators for constructors.

  "public-decorated-method",
  "protected-decorated-method",
  "private-decorated-method",

  "decorated-method" // = ["public-decorated-method", "protected-decorated-method", "private-decorated-method"]
]
```

### Member group types (with scope, ignoring accessibility)

Another option is to group the member types by their scope (`public`, `protected`, `private`), ignoring their accessibility.

```jsonc
[
  // Index signature
  // No scope for index signature. See above.

  // Fields
  "static-field", // = ["public-static-field", "protected-static-field", "private-static-field"]
  "instance-field", // = ["public-instance-field", "protected-instance-field", "private-instance-field"]
  "abstract-field", // = ["public-abstract-field", "protected-abstract-field", "private-abstract-field"]

  // Constructors
  "constructor", // = ["public-constructor", "protected-constructor", "private-constructor"]

  // Methods
  "static-method", // = ["public-static-method", "protected-static-method", "private-static-method"]
  "instance-method", // = ["public-instance-method", "protected-instance-method", "private-instance-method"]
  "abstract-method" // = ["public-abstract-method", "protected-abstract-method", "private-abstract-method"]
]
```

### Member group types (with scope and accessibility)

The third grouping option is to ignore both scope and accessibility.

```jsonc
[
  // Index signature
  // No grouping for index signature. See above.

  // Fields
  "field", // = ["public-static-field", "protected-static-field", "private-static-field", "public-instance-field", "protected-instance-field", "private-instance-field",
  //              "public-abstract-field", "protected-abstract-field", private-abstract-field"]

  // Constructors
  // Only the accessibility of constructors is configurable. See above.

  // Methods
  "method" // = ["public-static-method", "protected-static-method", "private-static-method", "public-instance-method", "protected-instance-method", "private-instance-method",
  //                "public-abstract-method", "protected-abstract-method", "private-abstract-method"]
]
```

### Default configuration

The default configuration looks as follows:

```jsonc
{
  "default": [
    // Index signature
    "signature",

    // Fields
    "public-static-field",
    "protected-static-field",
    "private-static-field",

    "public-decorated-field",
    "protected-decorated-field",
    "private-decorated-field",

    "public-instance-field",
    "protected-instance-field",
    "private-instance-field",

    "public-abstract-field",
    "protected-abstract-field",
    "private-abstract-field",

    "public-field",
    "protected-field",
    "private-field",

    "static-field",
    "instance-field",
    "abstract-field",

    "decorated-field",

    "field",

    // Constructors
    "public-constructor",
    "protected-constructor",
    "private-constructor",

    "constructor",

    // Methods
    "public-static-method",
    "protected-static-method",
    "private-static-method",

    "public-decorated-method",
    "protected-decorated-method",
    "private-decorated-method",

    "public-instance-method",
    "protected-instance-method",
    "private-instance-method",

    "public-abstract-method",
    "protected-abstract-method",
    "private-abstract-method",

    "public-method",
    "protected-method",
    "private-method",

    "static-method",
    "instance-method",
    "abstract-method",

    "decorated-method",

    "method"
  ]
}
```

Note: The default configuration contains member group types which contain other member types (see above). This is intentional to provide better error messages.

Note: By default, the members are not sorted. If you want to sort them alphabetically, you have to provide a custom configuration.

## Examples

### Custom `default` configuration

Note: The `default` options are overwritten in these examples.

#### Configuration: `{ "default": ["signature", "method", "constructor", "field"] }`

##### Incorrect examples

```ts
interface Foo {
  B: string; // -> field

  new (); // -> constructor

  A(): void; // -> method

  [Z: string]: any; // -> signature
}
```

Note: Wrong order.

```ts
type Foo = {
  B: string; // -> field

  // no constructor

  A(): void; // -> method

  // no signature
};
```

Note: Not all specified member types have to exist.

```ts
class Foo {
  private C: string; // -> field
  public D: string; // -> field
  protected static E: string; // -> field

  constructor() {} // -> constructor

  public static A(): void {} // -> method
  public B(): void {} // -> method

  [Z: string]: any; // -> signature
}
```

Note: Accessibility or scope are ignored with this configuration.

```ts
const Foo = class {
  private C: string; // -> field
  public D: string; // -> field

  constructor() {} // -> constructor

  public static A(): void {} // -> method
  public B(): void {} // -> method

  [Z: string]: any; // -> signature

  protected static E: string; // -> field
};
```

Note: Not all members have to be grouped to find rule violations.

##### Correct examples

```ts
interface Foo {
  [Z: string]: any; // -> signature

  A(): void; // -> method

  new (); // -> constructor

  B: string; // -> field
}
```

```ts
type Foo = {
  // no signature

  A(): void; // -> method

  // no constructor

  B: string; // -> field
};
```

```ts
class Foo {
  [Z: string]: any; // -> signature

  public static A(): void {} // -> method
  public B(): void {} // -> method

  constructor() {} // -> constructor

  private C: string; // -> field
  public D: string; // -> field
  protected static E: string; // -> field
}
```

```ts
const Foo = class {
  [Z: string]: any; // -> signature

  public static A(): void {} // -> method
  public B(): void {} // -> method

  constructor() {} // -> constructor

  private C: string; // -> field
  public D: string; // -> field
  protected static E: string; // -> field
};
```

#### Configuration: `{ "default": ["public-instance-method", "public-static-field"] }`

Note: This configuration does not apply to interfaces/type literals as accessibility and scope are not part of interfaces/type literals.

##### Incorrect examples

```ts
class Foo {
  private C: string; // (irrelevant)

  public D: string; // (irrelevant)

  public static E: string; // -> public static field

  constructor() {} // (irrelevant)

  public static A(): void {} // (irrelevant)

  [Z: string]: any; // (irrelevant)

  public B(): void {} // -> public instance method
}
```

Note: Public instance methods should come first before public static fields. Everything else can be placed anywhere.

```ts
const Foo = class {
  private C: string; // (irrelevant)

  [Z: string]: any; // (irrelevant)

  public static E: string; // -> public static field

  public D: string; // (irrelevant)

  constructor() {} // (irrelevant)

  public static A(): void {} // (irrelevant)

  public B(): void {} // -> public instance method
};
```

Note: Public instance methods should come first before public static fields. Everything else can be placed anywhere.

##### Correct examples

```ts
class Foo {
  public B(): void {} // -> public instance method

  private C: string; // (irrelevant)

  public D: string; // (irrelevant)

  public static E: string; // -> public static field

  constructor() {} // (irrelevant)

  public static A(): void {} // (irrelevant)

  [Z: string]: any; // (irrelevant)
}
```

```ts
const Foo = class {
  public B(): void {} // -> public instance method

  private C: string; // (irrelevant)

  [Z: string]: any; // (irrelevant)

  public D: string; // (irrelevant)

  constructor() {} // (irrelevant)

  public static A(): void {} // (irrelevant)

  public static E: string; // -> public static field
};
```

#### Configuration: `{ "default": ["public-static-field", "static-field", "instance-field"] }`

Note: This configuration does not apply to interfaces/type literals as accessibility and scope are not part of interfaces/type literals.

##### Incorrect examples

```ts
class Foo {
  private E: string; // -> instance field

  private static B: string; // -> static field
  protected static C: string; // -> static field
  private static D: string; // -> static field

  public static A: string; // -> public static field

  [Z: string]: any; // (irrelevant)
}
```

Note: Public static fields should come first, followed by static fields and instance fields.

```ts
const foo = class {
  public T(): void {} // (irrelevant)

  private static B: string; // -> static field

  constructor() {} // (irrelevant)

  private E: string; // -> instance field

  protected static C: string; // -> static field
  private static D: string; // -> static field

  [Z: string]: any; // (irrelevant)

  public static A: string; // -> public static field
};
```

Note: Public static fields should come first, followed by static fields and instance fields.

##### Correct examples

```ts
class Foo {
  public static A: string; // -> public static field

  private static B: string; // -> static field
  protected static C: string; // -> static field
  private static D: string; // -> static field

  private E: string; // -> instance field
}
```

```ts
const foo = class {
  [Z: string]: any; // -> signature

  public static A: string; // -> public static field

  constructor() {} // -> constructor

  private static B: string; // -> static field
  protected static C: string; // -> static field
  private static D: string; // -> static field

  private E: string; // -> instance field

  public T(): void {} // -> method
};
```

### Custom `classes` configuration

Note: If this is not set, the `default` will automatically be applied to classes as well. If a `classes` configuration is provided, only this configuration will be used for `classes` (i.e. nothing will be merged with `default`).

Note: The configuration for `classes` does not apply to class expressions (use `classExpressions` for them).

#### Configuration: `{ "classes": ["method", "constructor", "field"] }`

##### Incorrect example

```ts
class Foo {
  private C: string; // -> field
  public D: string; // -> field
  protected static E: string; // -> field

  constructor() {} // -> constructor

  public static A(): void {} // -> method
  public B(): void {} // -> method
}
```

##### Correct example

```ts
class Foo {
  public static A(): void {} // -> method
  public B(): void {} // -> method

  constructor() {} // -> constructor

  private C: string; // -> field
  public D: string; // -> field
  protected static E: string; // -> field
}
```

#### Configuration: `{ "classes": ["public-instance-method", "public-static-field"] }`

##### Incorrect example

```ts
class Foo {
  private C: string; // (irrelevant)

  public D: string; // (irrelevant)

  public static E: string; // -> public static field

  constructor() {} // (irrelevant)

  public static A(): void {} // (irrelevant)

  public B(): void {} // -> public instance method
}
```

##### Correct example

```ts
class Foo {
  private C: string; // (irrelevant)

  public D: string; // (irrelevant)

  public B(): void {} // -> public instance method

  constructor() {} // (irrelevant)

  public static A(): void {} // (irrelevant)

  public static E: string; // -> public static field
}
```

### Custom `classExpressions` configuration

Note: If this is not set, the `default` will automatically be applied to classes expressions as well. If a `classExpressions` configuration is provided, only this configuration will be used for `classExpressions` (i.e. nothing will be merged with `default`).

Note: The configuration for `classExpressions` does not apply to classes (use `classes` for them).

#### Configuration: `{ "classExpressions": ["method", "constructor", "field"] }`

##### Incorrect example

```ts
const foo = class {
  private C: string; // -> field
  public D: string; // -> field
  protected static E: string; // -> field

  constructor() {} // -> constructor

  public static A(): void {} // -> method
  public B(): void {} // -> method
};
```

##### Correct example

```ts
const foo = class {
  public static A(): void {} // -> method
  public B(): void {} // -> method

  constructor() {} // -> constructor

  private C: string; // -> field
  public D: string; // -> field
  protected static E: string; // -> field
};
```

#### Configuration: `{ "classExpressions": ["public-instance-method", "public-static-field"] }`

##### Incorrect example

```ts
const foo = class {
  private C: string; // (irrelevant)

  public D: string; // (irrelevant)

  public static E: string; // -> public static field

  constructor() {} // (irrelevant)

  public static A(): void {} // (irrelevant)

  public B(): void {} // -> public instance method
};
```

##### Correct example

```ts
const foo = class {
  private C: string; // (irrelevant)

  public D: string; // (irrelevant)

  public B(): void {} // -> public instance method

  public static E: string; // -> public static field

  constructor() {} // (irrelevant)

  public static A(): void {} // (irrelevant)
};
```

### Custom `interfaces` configuration

Note: If this is not set, the `default` will automatically be applied to classes expressions as well. If a `interfaces` configuration is provided, only this configuration will be used for `interfaces` (i.e. nothing will be merged with `default`).

Note: The configuration for `interfaces` only allows a limited set of member types: `signature`, `field`, `constructor` and `method`.

Note: The configuration for `interfaces` does not apply to type literals (use `typeLiterals` for them).

#### Configuration: `{ "interfaces": ["signature", "method", "constructor", "field"] }`

##### Incorrect example

```ts
interface Foo {
  B: string; // -> field

  new (); // -> constructor

  A(): void; // -> method

  [Z: string]: any; // -> signature
}
```

##### Correct example

```ts
interface Foo {
  [Z: string]: any; // -> signature

  A(): void; // -> method

  new (); // -> constructor

  B: string; // -> field
}
```

### Custom `typeLiterals` configuration

Note: If this is not set, the `default` will automatically be applied to classes expressions as well. If a `typeLiterals` configuration is provided, only this configuration will be used for `typeLiterals` (i.e. nothing will be merged with `default`).

Note: The configuration for `typeLiterals` only allows a limited set of member types: `signature`, `field`, `constructor` and `method`.

Note: The configuration for `typeLiterals` does not apply to interfaces (use `interfaces` for them).

#### Configuration: `{ "typeLiterals": ["signature", "method", "constructor", "field"] }`

##### Incorrect example

```ts
type Foo = {
  B: string; // -> field

  A(): void; // -> method

  new (); // -> constructor

  [Z: string]: any; // -> signature
};
```

##### Correct example

```ts
type Foo = {
  [Z: string]: any; // -> signature

  A(): void; // -> method

  new (); // -> constructor

  B: string; // -> field
};
```

### Sorting alphabetically within member groups

It is possible to sort all members within a group alphabetically.

#### Configuration: `{ "default": { "memberTypes": <Default Order>, "order": "alphabetically" } }`

This will apply the default order (see above) and enforce an alphabetic order within each group.

##### Incorrect examples

```ts
interface Foo {
  a: x;
  b: x;
  c: x;

  new (): Bar;
  (): Baz;

  a(): void;
  b(): void;
  c(): void;

  // Wrong group order, should be placed before all field definitions
  [a: string]: number;
}
```

```ts
interface Foo {
  [a: string]: number;

  a: x;
  b: x;
  c: x;

  new (): Bar;
  (): Baz;

  // Wrong alphabetic order within group
  c(): void;
  b(): void;
  a(): void;
}
```

### Sorting alphabetically while ignoring member groups

It is also possible to sort all members and ignore the member groups completely.

#### Configuration: `{ "default": { "memberTypes": "never", "order": "alphabetically" } }`

##### Incorrect example

```ts
interface Foo {
  b(): void;
  a: b;

  [a: string]: number; // Order doesn't matter (no sortable identifier)
  new (): Bar; // Order doesn't matter (no sortable identifier)
  (): Baz; // Order doesn't matter (no sortable identifier)
}
```

Note: Wrong alphabetic order `b(): void` should come after `a: b`.

## When Not To Use It

If you don't care about the general structure of your classes and interfaces, then you will not need this rule.

## Compatibility

- TSLint: [member-ordering](https://palantir.github.io/tslint/rules/member-ordering/)
