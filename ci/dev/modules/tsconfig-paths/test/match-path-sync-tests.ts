import { assert } from "chai";
import { createMatchPath } from "../src/match-path-sync";
import * as Tests from "./data/match-path-data";

describe("match-path-sync", () => {
  Tests.tests.forEach(t =>
    it(t.name, () => {
      const matchPath = createMatchPath(
        t.absoluteBaseUrl,
        t.paths,
        t.mainFields,
        t.addMatchAll
      );
      const result = matchPath(
        t.requestedModule,
        (_: string) => t.packageJson,
        (name: string) => t.existingFiles.indexOf(name) !== -1, // fileExists
        t.extensions
      );
      assert.equal(result, t.expectedPath);
    })
  );
});
