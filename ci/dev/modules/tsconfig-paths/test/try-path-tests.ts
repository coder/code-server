import { assert } from "chai";
import { getPathsToTry } from "../src/try-path";
import { join } from "path";

describe("mapping-entry", () => {
  const abosolutePathMappings = [
    {
      pattern: "longest/pre/fix/*",
      paths: [join("/absolute", "base", "url", "foo2", "bar")]
    },
    { pattern: "pre/fix/*", paths: [join("/absolute", "base", "url", "foo3")] },
    { pattern: "*", paths: [join("/absolute", "base", "url", "foo1")] }
  ];
  it("should return no paths for relative requested module", () => {
    const result = getPathsToTry(
      [".ts", "tsx"],
      abosolutePathMappings,
      "./requested-module"
    );
    assert.deepEqual(result, undefined);
  });

  it("should return no paths if no pattern match the requested module", () => {
    const result = getPathsToTry(
      [".ts", "tsx"],
      [
        {
          pattern: "longest/pre/fix/*",
          paths: [join("/absolute", "base", "url", "foo2", "bar")]
        },
        {
          pattern: "pre/fix/*",
          paths: [join("/absolute", "base", "url", "foo3")]
        }
      ],
      "requested-module"
    );
    assert.deepEqual(result, undefined);
  });

  it("should get all paths that matches requested module", () => {
    const result = getPathsToTry(
      [".ts", ".tsx"],
      abosolutePathMappings,
      "longest/pre/fix/requested-module"
    );
    assert.deepEqual(result, [
      // "longest/pre/fix/*"
      { type: "file", path: join("/absolute", "base", "url", "foo2", "bar") },
      {
        type: "extension",
        path: join("/absolute", "base", "url", "foo2", "bar.ts")
      },
      {
        type: "extension",
        path: join("/absolute", "base", "url", "foo2", "bar.tsx")
      },
      {
        type: "package",
        path: join("/absolute", "base", "url", "foo2", "bar", "package.json")
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo2", "bar", "index.ts")
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo2", "bar", "index.tsx")
      },
      // "*"
      { type: "file", path: join("/absolute", "base", "url", "foo1") },
      { type: "extension", path: join("/absolute", "base", "url", "foo1.ts") },
      { type: "extension", path: join("/absolute", "base", "url", "foo1.tsx") },
      {
        type: "package",
        path: join("/absolute", "base", "url", "foo1", "package.json")
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo1", "index.ts")
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo1", "index.tsx")
      }
    ]);
  });
});

// describe("match-star", () => {
//   it("should match star in last position", () => {
//     const result = matchStar("lib/*", "lib/mylib");
//     assert.equal(result, "mylib");
//   });
//   it("should match star in first position", () => {
//     const result = matchStar("*/lib", "mylib/lib");
//     assert.equal(result, "mylib");
//   });
// });
