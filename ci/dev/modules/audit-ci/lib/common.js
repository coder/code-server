const { spawn } = require("cross-spawn");
const eventStream = require("event-stream");
const JSONStream = require("JSONStream");
const ReadlineTransform = require("readline-transform");
const { blue, yellow } = require("./colors");

function reportAudit(summary, config) {
  const { allowlist, "show-not-found": showNotFound, showFound } = config;
  if (allowlist.modules.length) {
    console.log(blue, `Modules to allowlist: ${allowlist.modules.join(", ")}.`);
  }

  if (showFound) {
    if (summary.allowlistedModulesFound.length) {
      const found = summary.allowlistedModulesFound.join(", ");
      const msg = `Found vulnerable allowlisted modules: ${found}.`;
      console.warn(yellow, msg);
    }
    if (summary.allowlistedAdvisoriesFound.length) {
      const found = summary.allowlistedAdvisoriesFound.join(", ");
      const msg = `Found vulnerable allowlisted advisories: ${found}.`;
      console.warn(yellow, msg);
    }
  }
  if (showNotFound) {
    if (summary.allowlistedModulesNotFound.length) {
      const found = summary.allowlistedModulesNotFound
        .sort((a, b) => a - b)
        .join(", ");
      const msg =
        summary.allowlistedModulesNotFound.length === 1
          ? `Consider not allowlisting module: ${found}.`
          : `Consider not allowlisting modules: ${found}.`;
      console.warn(yellow, msg);
    }
    if (summary.allowlistedAdvisoriesNotFound.length) {
      const found = summary.allowlistedAdvisoriesNotFound
        .sort((a, b) => a - b)
        .join(", ");
      const msg =
        summary.allowlistedAdvisoriesNotFound.length === 1
          ? `Consider not allowlisting advisory: ${found}.`
          : `Consider not allowlisting advisories: ${found}.`;
      console.warn(yellow, msg);
    }
    if (summary.allowlistedPathsNotFound.length) {
      const found = summary.allowlistedPathsNotFound
        .sort((a, b) => a - b)
        .join(", ");
      const msg =
        summary.allowlistedPathsNotFound.length === 1
          ? `Consider not allowlisting path: ${found}.`
          : `Consider not allowlisting paths: ${found}.`;
      console.warn(yellow, msg);
    }
  }

  if (summary.failedLevelsFound.length) {
    // Get the levels that have failed by filtering the keys with true values
    const err = `Failed security audit due to ${summary.failedLevelsFound.join(
      ", "
    )} vulnerabilities.\nVulnerable advisories are: ${summary.advisoriesFound.join(
      ", "
    )}`;
    throw new Error(err);
  }
  return summary;
}

function runProgram(command, args, options, stdoutListener, stderrListener) {
  const transform = new ReadlineTransform({ skipEmpty: true });
  const proc = spawn(command, args, options);
  proc.stdout.setEncoding("utf8");
  proc.stdout
    .pipe(transform)
    .pipe(JSONStream.parse())
    .pipe(
      eventStream.mapSync((data) => {
        if (!data) return;
        try {
          // due to response without error
          if (data.message && data.message.includes("ENOTFOUND")) {
            stderrListener(data.message);
            return;
          }
          if (data.statusCode === 404) {
            stderrListener(data.message);
            return;
          }

          stdoutListener(data);
        } catch (error) {
          stderrListener(error);
        }
      })
    );
  return new Promise((resolve, reject) => {
    proc.on("close", () => resolve());
    proc.on("error", (error) => reject(error));
  });
}

module.exports = {
  runProgram,
  reportAudit,
};
