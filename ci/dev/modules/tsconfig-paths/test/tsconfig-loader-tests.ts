import { assert } from "chai";
import {
  loadTsconfig,
  tsConfigLoader,
  walkForTsConfig
} from "../src/tsconfig-loader";
import { join } from "path";

describe("tsconfig-loader", () => {
  it("should find tsconfig in cwd", () => {
    const result = tsConfigLoader({
      cwd: "/foo/bar",
      getEnv: (_: string) => undefined,
      loadSync: (cwd: string) => {
        return {
          tsConfigPath: `${cwd}/tsconfig.json`,
          baseUrl: "./",
          paths: {}
        };
      }
    });

    assert.equal(result.tsConfigPath, "/foo/bar/tsconfig.json");
  });

  it("should return loaderResult.tsConfigPath as undefined when not found", () => {
    const result = tsConfigLoader({
      cwd: "/foo/bar",
      getEnv: (_: string) => undefined,
      loadSync: (_: string) => {
        return {
          tsConfigPath: undefined,
          baseUrl: "./",
          paths: {}
        };
      }
    });

    assert.isUndefined(result.tsConfigPath);
  });

  it("should use TS_NODE_PROJECT env if exists", () => {
    const result = tsConfigLoader({
      cwd: "/foo/bar",
      getEnv: (key: string) =>
        key === "TS_NODE_PROJECT" ? "/foo/baz" : undefined,
      loadSync: (cwd: string, fileName: string) => {
        if (cwd === "/foo/bar" && fileName === "/foo/baz") {
          return {
            tsConfigPath: "/foo/baz/tsconfig.json",
            baseUrl: "./",
            paths: {}
          };
        }

        return {
          tsConfigPath: undefined,
          baseUrl: "./",
          paths: {}
        };
      }
    });

    assert.equal(result.tsConfigPath, "/foo/baz/tsconfig.json");
  });
});

describe("walkForTsConfig", () => {
  it("should find tsconfig in starting directory", () => {
    const pathToTsconfig = join("/root", "dir1", "tsconfig.json");
    const res = walkForTsConfig(
      join("/root", "dir1"),
      path => path === pathToTsconfig
    );
    assert.equal(res, pathToTsconfig);
  });

  it("should find tsconfig in parent directory", () => {
    const pathToTsconfig = join("/root", "tsconfig.json");
    const res = walkForTsConfig(
      join("/root", "dir1"),
      path => path === pathToTsconfig
    );
    assert.equal(res, pathToTsconfig);
  });

  it("should return undefined when reaching the top", () => {
    const res = walkForTsConfig(join("/root", "dir1", "kalle"), () => false);
    assert.equal(res, undefined);
  });
});

describe("loadConfig", () => {
  it("It should load a config", () => {
    const config = { compilerOptions: { baseUrl: "hej" } };
    const res = loadTsconfig(
      "/root/dir1/tsconfig.json",
      path => path === "/root/dir1/tsconfig.json",
      _ => JSON.stringify(config)
    );
    assert.deepEqual(res, config);
  });

  it("It should load a config with comments", () => {
    const config = { compilerOptions: { baseUrl: "hej" } };
    const res = loadTsconfig(
      "/root/dir1/tsconfig.json",
      path => path === "/root/dir1/tsconfig.json",
      _ => `{
          // my comment
          "compilerOptions": { 
            "baseUrl": "hej"
          }
        }`
    );
    assert.deepEqual(res, config);
  });

  it("It should load a config with trailing commas", () => {
    const config = { compilerOptions: { baseUrl: "hej" } };
    const res = loadTsconfig(
      "/root/dir1/tsconfig.json",
      path => path === "/root/dir1/tsconfig.json",
      _ => `{
          "compilerOptions": { 
            "baseUrl": "hej",
          },
        }`
    );
    assert.deepEqual(res, config);
  });

  it("It should load a config with extends and overwrite all options", () => {
    const firstConfig = {
      extends: "../base-config.json",
      compilerOptions: { baseUrl: "kalle", paths: { foo: ["bar2"] } }
    };
    const firstConfigPath = join("/root", "dir1", "tsconfig.json");
    const baseConfig = {
      compilerOptions: {
        baseUrl: "olle",
        paths: { foo: ["bar1"] },
        strict: true
      }
    };
    const baseConfigPath = join("/root", "base-config.json");
    const res = loadTsconfig(
      join("/root", "dir1", "tsconfig.json"),
      path => path === firstConfigPath || path === baseConfigPath,
      path => {
        if (path === firstConfigPath) {
          return JSON.stringify(firstConfig);
        }
        if (path === baseConfigPath) {
          return JSON.stringify(baseConfig);
        }
        return "";
      }
    );

    assert.deepEqual(res, {
      extends: "../base-config.json",
      compilerOptions: {
        baseUrl: "kalle",
        paths: { foo: ["bar2"] },
        strict: true
      }
    });
  });

  it("Should use baseUrl relative to location of extended tsconfig", () => {
    const firstConfig = { compilerOptions: { baseUrl: "." } };
    const firstConfigPath = join("/root", "first-config.json");
    const secondConfig = { extends: "../first-config.json" };
    const secondConfigPath = join("/root", "dir1", "second-config.json");
    const thirdConfig = { extends: "../second-config.json" };
    const thirdConfigPath = join("/root", "dir1", "dir2", "third-config.json");
    const res = loadTsconfig(
      join("/root", "dir1", "dir2", "third-config.json"),
      path =>
        path === firstConfigPath ||
        path === secondConfigPath ||
        path === thirdConfigPath,
      path => {
        if (path === firstConfigPath) {
          return JSON.stringify(firstConfig);
        }
        if (path === secondConfigPath) {
          return JSON.stringify(secondConfig);
        }
        if (path === thirdConfigPath) {
          return JSON.stringify(thirdConfig);
        }
        return "";
      }
    );

    assert.deepEqual(res, {
      extends: "../second-config.json",
      compilerOptions: { baseUrl: join("..", "..") }
    });
  });
});
