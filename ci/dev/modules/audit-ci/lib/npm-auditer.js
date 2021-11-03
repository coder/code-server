const { blue } = require("./colors");
const { runProgram, reportAudit } = require("./common");
const Model = require("./Model");

async function runNpmAudit(config) {
  const { directory, registry, _npm } = config;
  const npmExec = _npm || "npm";

  let stdoutBuffer = {};
  function outListener(data) {
    stdoutBuffer = { ...stdoutBuffer, ...data };
  }

  const stderrBuffer = [];
  function errListener(line) {
    stderrBuffer.push(line);
  }

  const args = ["audit", "--json"];
  if (registry) {
    args.push("--registry", registry);
  }
  if (config["skip-dev"]) {
    args.push("--production");
  }
  const options = { cwd: directory };
  await runProgram(npmExec, args, options, outListener, errListener);
  if (stderrBuffer.length) {
    throw new Error(
      `Invocation of npm audit failed:\n${stderrBuffer.join("\n")}`
    );
  }
  return stdoutBuffer;
}

function printReport(parsedOutput, levels, reportType) {
  const printReportObj = (text, obj) => {
    console.log(blue, text);
    console.log(JSON.stringify(obj, null, 2));
  };
  switch (reportType) {
    case "full":
      printReportObj("NPM audit report JSON:", parsedOutput);
      break;
    case "important": {
      const advisories =
        parsedOutput.auditReportVersion === 2
          ? parsedOutput.vulnerabilities
          : parsedOutput.advisories;
      const relevantAdvisories = Object.keys(advisories).reduce(
        (acc, advisory) =>
          levels[advisories[advisory].severity]
            ? { [advisory]: advisories[advisory], ...acc }
            : acc,
        {}
      );
      const keyFindings = {
        advisories: relevantAdvisories,
        metadata: parsedOutput.metadata,
      };
      printReportObj("NPM audit report results:", keyFindings);
      break;
    }
    case "summary":
      printReportObj("NPM audit report summary:", parsedOutput.metadata);
      break;
    default:
      throw new Error(
        `Invalid report type: ${reportType}. Should be \`['important', 'full', 'summary']\`.`
      );
  }
}

function report(parsedOutput, config, reporter) {
  printReport(parsedOutput, config.levels, config["report-type"]);
  const model = new Model(config);
  const summary = model.load(parsedOutput);
  return reporter(summary, config, parsedOutput);
}

/**
 * Audit your NPM project!
 *
 * @param {{directory: string, report: { full?: boolean, summary?: boolean }, allowlist: object, registry: string, levels: { low: boolean, moderate: boolean, high: boolean, critical: boolean }}} config
 * `directory`: the directory containing the package.json to audit.
 * `report-type`: [`important`, `summary`, `full`] how the audit report is displayed.
 * `allowlist`: an object containing a list of modules, advisories, and module paths that should not break the build if their vulnerability is found.
 * `registry`: the registry to resolve packages by name and version.
 * `show-not-found`: show allowlisted advisories that are not found.
 * `levels`: the vulnerability levels to fail on, if `moderate` is set `true`, `high` and `critical` should be as well.
 * `skip-dev`: skip devDependencies, defaults to false
 * `_npm`: a path to npm, uses npm from PATH if not specified.
 * @returns {Promise<any>} Returns the audit report summary on resolve, `Error` on rejection.
 */
async function audit(config, reporter = reportAudit) {
  const parsedOutput = await runNpmAudit(config);
  if (parsedOutput.error) {
    const { code, summary } = parsedOutput.error;
    throw new Error(`code ${code}: ${summary}`);
  }
  return report(parsedOutput, config, reporter);
}

module.exports = {
  audit,
  report,
};
