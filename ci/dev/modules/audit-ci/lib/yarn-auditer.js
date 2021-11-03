const childProcess = require("child_process");
const semver = require("semver");
const { blue, red, yellow } = require("./colors");
const { reportAudit, runProgram } = require("./common");
const Model = require("./Model");

const MINIMUM_YARN_CLASSIC_VERSION = "1.12.3";
const MINIMUM_YARN_BERRY_VERSION = "2.4.0";
/**
 * Change this to the appropriate version when
 * yarn audit --registry is supported:
 * @see https://github.com/yarnpkg/yarn/issues/7012
 */
const MINIMUM_YARN_AUDIT_REGISTRY_VERSION = "99.99.99";

function getYarnVersion(cwd) {
  const version = childProcess
    .execSync("yarn -v", { cwd })
    .toString()
    .replace("\n", "");
  return version;
}

function yarnSupportsClassicAudit(yarnVersion) {
  return semver.satisfies(yarnVersion, `^${MINIMUM_YARN_CLASSIC_VERSION}`);
}

function yarnSupportsBerryAudit(yarnVersion) {
  return semver.gte(yarnVersion, MINIMUM_YARN_BERRY_VERSION);
}

function yarnSupportsAudit(yarnVersion) {
  return (
    yarnSupportsClassicAudit(yarnVersion) || yarnSupportsBerryAudit(yarnVersion)
  );
}

function yarnAuditSupportsRegistry(yarnVersion) {
  return semver.gte(yarnVersion, MINIMUM_YARN_AUDIT_REGISTRY_VERSION);
}

/**
 * Audit your Yarn project!
 *
 * @param {{directory: string, report: { full?: boolean, summary?: boolean }, allowlist: object, registry: string, levels: { low: boolean, moderate: boolean, high: boolean, critical: boolean }}} config
 * `directory`: the directory containing the package.json to audit.
 * `report-type`: [`important`, `summary`, `full`] how the audit report is displayed.
 * `allowlist`: an object containing a list of modules, advisories, and module paths that should not break the build if their vulnerability is found.
 * `registry`: the registry to resolve packages by name and version.
 * `show-not-found`: show allowlisted advisories that are not found.
 * `levels`: the vulnerability levels to fail on, if `moderate` is set `true`, `high` and `critical` should be as well.
 * `skip-dev`: skip devDependencies, defaults to false
 * `_yarn`: a path to yarn, uses yarn from PATH if not specified.
 * @returns {Promise<any>} Returns the audit report summary on resolve, `Error` on rejection.
 */
async function audit(config, reporter = reportAudit) {
  const {
    levels,
    registry,
    "report-type": reportType,
    "skip-dev": skipDev,
    _yarn,
  } = config;
  const yarnExec = _yarn || "yarn";
  let missingLockFile = false;
  const model = new Model(config);

  const yarnVersion = getYarnVersion(config.directory);
  const isYarnVersionSupported = yarnSupportsAudit(yarnVersion);
  if (!isYarnVersionSupported) {
    throw new Error(
      `Yarn ${yarnVersion} not supported, must be ^${MINIMUM_YARN_CLASSIC_VERSION} or >=${MINIMUM_YARN_BERRY_VERSION}`
    );
  }
  const isYarnClassic = yarnSupportsClassicAudit(yarnVersion);
  const yarnName = isYarnClassic ? `Yarn` : `Yarn Berry`;

  switch (reportType) {
    case "full":
      console.log(blue, `${yarnName} audit report JSON:`);
      break;
    case "important":
      console.log(blue, `${yarnName} audit report results:`);
      break;
    case "summary":
      console.log(blue, `${yarnName} audit report summary:`);
      break;
    default:
      throw new Error(
        `Invalid report type: ${reportType}. Should be \`['important', 'full', 'summary']\`.`
      );
  }

  const printJson = (data) => {
    console.log(JSON.stringify(data, null, 2));
  };
  // Define a function to print based on the report type.
  let printAuditData;
  switch (reportType) {
    case "full":
      printAuditData = (line) => {
        printJson(line);
      };
      break;
    case "important":
      if (isYarnClassic) {
        printAuditData = ({ type, data }) => {
          if (
            (type === "auditAdvisory" && levels[data.advisory.severity]) ||
            type === "auditSummary"
          ) {
            printJson(data);
          }
        };
      } else {
        printAuditData = ({ metadata }) => {
          printJson(metadata);
        };
      }
      break;
    case "summary":
      if (isYarnClassic) {
        printAuditData = ({ type, data }) => {
          if (type === "auditSummary") {
            printJson(data);
          }
        };
      } else {
        printAuditData = ({ metadata }) => {
          printJson(metadata);
        };
      }
      break;
    default:
      throw new Error(
        `Invalid report type: ${reportType}. Should be \`['important', 'full', 'summary']\`.`
      );
  }

  function outListener(line) {
    try {
      if (isYarnClassic) {
        const { type, data } = line;
        printAuditData(line);

        if (type === "info" && data === "No lockfile found.") {
          missingLockFile = true;
          return;
        }

        if (type !== "auditAdvisory") {
          return;
        }

        model.process(data.advisory);
      } else {
        printAuditData(line);

        Object.values(line.advisories).forEach((advisory) => {
          model.process(advisory);
        });
      }
    } catch (err) {
      console.error(red, `ERROR: Cannot JSONStream.parse response:`);
      console.error(line);
      throw err;
    }
  }

  const stderrBuffer = [];
  function errListener(line) {
    stderrBuffer.push(line);

    if (line.type === "error") {
      throw new Error(line.data);
    }
  }
  const options = { cwd: config.directory };
  const args = isYarnClassic
    ? ["audit", "--json"].concat(skipDev ? ["--groups", "dependencies"] : [])
    : ["npm", "audit", "--recursive", "--json"].concat(
        skipDev ? ["--environment", "production"] : ["--all"]
      );
  if (registry) {
    const auditRegistrySupported = yarnAuditSupportsRegistry(yarnVersion);
    if (auditRegistrySupported) {
      args.push("--registry", registry);
    } else {
      console.warn(
        yellow,
        "Yarn audit does not support the registry flag yet."
      );
    }
  }
  await runProgram(yarnExec, args, options, outListener, errListener);
  if (missingLockFile) {
    console.warn(
      yellow,
      "No yarn.lock file. This does not affect auditing, but it may be a mistake."
    );
  }

  const summary = model.getSummary((a) => a.id);
  return reporter(summary, config);
}

module.exports = { audit };
