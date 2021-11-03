/**
 * @property {string[]} modules
 * @property {number[]} advisories
 * @property {paths[]} paths
 * @export
 * @class Allowlist
 */
class Allowlist {
  /**
   *
   * @param {(string | number)[]} input the allowlisted module names, advisories, and module paths
   */
  constructor(input) {
    /** @type string[] */
    this.modules = [];
    /** @type number[] */
    this.advisories = [];
    /** @type string[] */
    this.paths = [];
    if (!input) {
      return;
    }
    input.forEach((arg) => {
      if (typeof arg === "number") {
        this.advisories.push(arg);
      } else if (arg.includes(">") || arg.includes("|")) {
        this.paths.push(arg);
      } else {
        this.modules.push(arg);
      }
    });
  }

  static mapConfigToAllowlist(config) {
    const {
      allowlist,
      advisories,
      whitelist,
      "path-whitelist": pathWhitelist,
    } = config;
    // It's possible someone duplicated the inputs.
    // The solution is to merge into one array, change to set, and back to array.
    // This will remove duplicates.
    const possiblyDuplicated = [
      ...(allowlist || []),
      ...(advisories || []),
      ...(whitelist || []),
      ...(pathWhitelist || []),
    ];
    const set = new Set(possiblyDuplicated);
    const input = [...set];
    const obj = new Allowlist(input);
    return obj;
  }
}

module.exports = Allowlist;
