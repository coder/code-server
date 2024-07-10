# Security Policy

Coder and the code-server team want to keep the code-server project secure and safe for end-users.

## Tools

We use the following tools to help us stay on top of vulnerability mitigation.

- [dependabot](https://dependabot.com/)
  - Submits pull requests to upgrade dependencies. We use dependabot's version
    upgrades as well as security updates.
- code-scanning
  - [CodeQL](https://securitylab.github.com/tools/codeql/)
    - Semantic code analysis engine that runs on a regular schedule (see
      `codeql-analysis.yml`)
  - [trivy](https://github.com/aquasecurity/trivy)
    - Comprehensive vulnerability scanner that runs on PRs into the default
      branch and scans both our container image and repository code (see
      `trivy-scan-repo` and `trivy-scan-image` jobs in `build.yaml`)
- `yarn audit` and `npm audit`
  - Audits Yarn/NPM dependencies.

## Supported Versions

Coder sponsors the development and maintenance of the code-server project. We will fix security issues within 90 days of receiving a report and publish the fix in a subsequent release. The code-server project does not provide backports or patch releases for security issues at this time.

| Version                                                 | Supported          |
| ------------------------------------------------------- | ------------------ |
| [Latest](https://github.com/coder/code-server/releases) | :white_check_mark: |

## Reporting a Vulnerability

To report a vulnerability, please send an email to security[@]coder.com, and our security team will respond to you.
