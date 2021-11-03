var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// lib/npm/node-platform.ts
var fs = require("fs");
var os = require("os");
var path = require("path");
var ESBUILD_BINARY_PATH = process.env.ESBUILD_BINARY_PATH || ESBUILD_BINARY_PATH;
var knownWindowsPackages = {
  "win32 arm64 LE": "esbuild-windows-arm64",
  "win32 ia32 LE": "esbuild-windows-32",
  "win32 x64 LE": "esbuild-windows-64"
};
var knownUnixlikePackages = {
  "android arm64 LE": "esbuild-android-arm64",
  "darwin arm64 LE": "esbuild-darwin-arm64",
  "darwin x64 LE": "esbuild-darwin-64",
  "freebsd arm64 LE": "esbuild-freebsd-arm64",
  "freebsd x64 LE": "esbuild-freebsd-64",
  "linux arm LE": "esbuild-linux-arm",
  "linux arm64 LE": "esbuild-linux-arm64",
  "linux ia32 LE": "esbuild-linux-32",
  "linux mips64el LE": "esbuild-linux-mips64le",
  "linux ppc64 LE": "esbuild-linux-ppc64le",
  "linux x64 LE": "esbuild-linux-64",
  "netbsd x64 LE": "esbuild-netbsd-64",
  "openbsd x64 LE": "esbuild-openbsd-64",
  "sunos x64 LE": "esbuild-sunos-64"
};
function pkgAndSubpathForCurrentPlatform() {
  let pkg;
  let subpath;
  let platformKey = `${process.platform} ${os.arch()} ${os.endianness()}`;
  if (platformKey in knownWindowsPackages) {
    pkg = knownWindowsPackages[platformKey];
    subpath = "esbuild.exe";
  } else if (platformKey in knownUnixlikePackages) {
    pkg = knownUnixlikePackages[platformKey];
    subpath = "bin/esbuild";
  } else {
    throw new Error(`Unsupported platform: ${platformKey}`);
  }
  return { pkg, subpath };
}
function downloadedBinPath(pkg, subpath) {
  const esbuildLibDir = path.dirname(require.resolve("esbuild"));
  return path.join(esbuildLibDir, `downloaded-${pkg}-${path.basename(subpath)}`);
}

// lib/npm/node-install.ts
var fs2 = require("fs");
var os2 = require("os");
var path2 = require("path");
var zlib = require("zlib");
var https = require("https");
var child_process = require("child_process");
var toPath = path2.join(__dirname, "bin", "esbuild");
var isToPathJS = true;
function validateBinaryVersion(...command) {
  command.push("--version");
  const stdout = child_process.execFileSync(command.shift(), command).toString().trim();
  if (stdout !== "0.13.9") {
    throw new Error(`Expected ${JSON.stringify("0.13.9")} but got ${JSON.stringify(stdout)}`);
  }
}
function isYarn() {
  const { npm_config_user_agent } = process.env;
  if (npm_config_user_agent) {
    return /\byarn\//.test(npm_config_user_agent);
  }
  return false;
}
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location)
        return fetch(res.headers.location).then(resolve, reject);
      if (res.statusCode !== 200)
        return reject(new Error(`Server responded with ${res.statusCode}`));
      let chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}
function extractFileFromTarGzip(buffer, subpath) {
  try {
    buffer = zlib.unzipSync(buffer);
  } catch (err) {
    throw new Error(`Invalid gzip data in archive: ${err && err.message || err}`);
  }
  let str = (i, n) => String.fromCharCode(...buffer.subarray(i, i + n)).replace(/\0.*$/, "");
  let offset = 0;
  subpath = `package/${subpath}`;
  while (offset < buffer.length) {
    let name = str(offset, 100);
    let size = parseInt(str(offset + 124, 12), 8);
    offset += 512;
    if (!isNaN(size)) {
      if (name === subpath)
        return buffer.subarray(offset, offset + size);
      offset += size + 511 & ~511;
    }
  }
  throw new Error(`Could not find ${JSON.stringify(subpath)} in archive`);
}
function installUsingNPM(pkg, subpath, binPath) {
  const env = __spreadProps(__spreadValues({}, process.env), { npm_config_global: void 0 });
  const esbuildLibDir = path2.dirname(require.resolve("esbuild"));
  const installDir = path2.join(esbuildLibDir, "npm-install");
  fs2.mkdirSync(installDir);
  try {
    fs2.writeFileSync(path2.join(installDir, "package.json"), "{}");
    child_process.execSync(`npm install --loglevel=error --prefer-offline --no-audit --progress=false ${pkg}@${"0.13.9"}`, { cwd: installDir, stdio: "pipe", env });
    const installedBinPath = path2.join(installDir, "node_modules", pkg, subpath);
    fs2.renameSync(installedBinPath, binPath);
  } finally {
    try {
      removeRecursive(installDir);
    } catch (e) {
    }
  }
}
function removeRecursive(dir) {
  for (const entry of fs2.readdirSync(dir)) {
    const entryPath = path2.join(dir, entry);
    let stats;
    try {
      stats = fs2.lstatSync(entryPath);
    } catch (e) {
      continue;
    }
    if (stats.isDirectory())
      removeRecursive(entryPath);
    else
      fs2.unlinkSync(entryPath);
  }
  fs2.rmdirSync(dir);
}
function applyManualBinaryPathOverride(overridePath) {
  const pathString = JSON.stringify(overridePath);
  fs2.writeFileSync(toPath, `#!/usr/bin/env node
require('child_process').execFileSync(${pathString}, process.argv.slice(2), { stdio: 'inherit' });
`);
  const libMain = path2.join(__dirname, "lib", "main.js");
  const code = fs2.readFileSync(libMain, "utf8");
  fs2.writeFileSync(libMain, `var ESBUILD_BINARY_PATH = ${pathString};
${code}`);
}
function maybeOptimizePackage(binPath) {
  if (os2.platform() !== "win32" && !isYarn()) {
    const tempPath = path2.join(__dirname, "bin-esbuild");
    try {
      fs2.linkSync(binPath, tempPath);
      fs2.renameSync(tempPath, toPath);
      isToPathJS = false;
      fs2.unlinkSync(tempPath);
    } catch (e) {
    }
  }
}
async function downloadDirectlyFromNPM(pkg, subpath, binPath) {
  const url = `https://registry.npmjs.org/${pkg}/-/${pkg}-${"0.13.9"}.tgz`;
  console.error(`[esbuild] Trying to download ${JSON.stringify(url)}`);
  try {
    fs2.writeFileSync(binPath, extractFileFromTarGzip(await fetch(url), subpath));
    fs2.chmodSync(binPath, 493);
  } catch (e) {
    console.error(`[esbuild] Failed to download ${JSON.stringify(url)}: ${e && e.message || e}`);
    throw e;
  }
}
async function checkAndPreparePackage() {
  if (ESBUILD_BINARY_PATH) {
    applyManualBinaryPathOverride(ESBUILD_BINARY_PATH);
    return;
  }
  const { pkg, subpath } = pkgAndSubpathForCurrentPlatform();
  let binPath;
  try {
    binPath = require.resolve(`${pkg}/${subpath}`);
  } catch (e) {
    console.error(`[esbuild] Failed to find package "${pkg}" on the file system

This can happen if you use the "--no-optional" flag. The "optionalDependencies"
package.json feature is used by esbuild to install the correct binary executable
for your current platform. This install script will now attempt to work around
this. If that fails, you need to remove the "--no-optional" flag to use esbuild.
`);
    binPath = downloadedBinPath(pkg, subpath);
    try {
      console.error(`[esbuild] Trying to install package "${pkg}" using npm`);
      installUsingNPM(pkg, subpath, binPath);
    } catch (e2) {
      console.error(`[esbuild] Failed to install package "${pkg}" using npm: ${e2 && e2.message || e2}`);
      try {
        await downloadDirectlyFromNPM(pkg, subpath, binPath);
      } catch (e3) {
        throw new Error(`Failed to install package "${pkg}"`);
      }
    }
  }
  maybeOptimizePackage(binPath);
}
checkAndPreparePackage().then(() => {
  if (isToPathJS) {
    validateBinaryVersion("node", toPath);
  } else {
    validateBinaryVersion(toPath);
  }
});
