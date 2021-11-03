const { yellow } = require("./colors");
const npmAuditer = require("./npm-auditer");
const yarnAuditer = require("./yarn-auditer");

const PARTIAL_RETRY_ERROR_MSG = {
  // The three ENOAUDIT error messages for NPM are:
  // `Either your login credentials are invalid or your registry (${opts.registry}) does not support audit.`
  // `Your configured registry (${opts.registry}) does not support audit requests.`
  // `Your configured registry (${opts.registry}) may not support audit requests, or the audit endpoint may be temporarily unavailable.`
  // Between them, all three use the phrasing 'not support audit'.
  npm: `not support audit`,
  yarn: "503 Service Unavailable",
};

function audit(pm, config, reporter) {
  const auditor = pm === "npm" ? npmAuditer : yarnAuditer;
  const {
    "pass-enoaudit": passENoAudit,
    "retry-count": maxRetryCount,
  } = config;

  async function run(attempt = 0) {
    try {
      const result = await auditor.audit(config, reporter);
      return result;
    } catch (err) {
      const message = err.message || err;
      const isRetryableMessage =
        typeof message === "string" &&
        message.includes(PARTIAL_RETRY_ERROR_MSG[pm]);
      const shouldRetry = attempt < maxRetryCount && isRetryableMessage;
      if (shouldRetry) {
        console.log("RETRY-RETRY");
        return run(attempt + 1);
      }
      const shouldPassWithoutAuditing = passENoAudit && isRetryableMessage;
      if (shouldPassWithoutAuditing) {
        console.warn(
          yellow,
          `ACTION RECOMMENDED: An audit could not performed due to ${maxRetryCount} audits that resulted in ENOAUDIT. Perform an audit manually and verify that no significant vulnerabilities exist before merging.`
        );
        return Promise.resolve();
      }
      throw err;
    }
  }

  return run();
}

module.exports = audit;
