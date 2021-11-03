import { assert } from "chai";
import * as Filesystem from "../src/filesystem";
import * as path from "path";

describe("filesystem", () => {
  const fileThatExists = path.join(__dirname, "../package.json");
  const fileThatNotExists = path.join(__dirname, "../package2.json");

  it("should find file that exists, sync", () => {
    const result = Filesystem.fileExistsSync(fileThatExists);
    assert.equal(result, true);
  });

  it("should not find file that not exists, sync", () => {
    const result = Filesystem.fileExistsSync(fileThatNotExists);
    assert.equal(result, false);
  });

  it("should find file that exists, async", done => {
    Filesystem.fileExistsAsync(fileThatExists, (_err, result) => {
      assert.equal(result, true);
      done();
    });
  });

  it("should not find file that not exists, async", done => {
    Filesystem.fileExistsAsync(fileThatNotExists, (_err, result) => {
      assert.equal(result, false);
      done();
    });
  });

  it("should load json, sync", () => {
    const result = Filesystem.readJsonFromDiskSync(fileThatExists);
    assert.isOk(result);
    assert.equal(result.main, "lib/index.js");
  });

  it("should load json, async", done => {
    Filesystem.readJsonFromDiskAsync(fileThatExists, (_err, result) => {
      assert.isOk(result);
      assert.equal(result.main, "lib/index.js");
      done();
    });
  });
});
