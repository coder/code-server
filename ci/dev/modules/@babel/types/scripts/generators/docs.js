import util from "util";
import stringifyValidator from "../utils/stringifyValidator.js";
import toFunctionName from "../utils/toFunctionName.js";

import t from "../../lib/index.js";

const readme = [
  `# @babel/types

> This module contains methods for building ASTs manually and for checking the types of AST nodes.

## Install

\`\`\`sh
npm install --save-dev @babel/types
\`\`\`

## API`,
];

const customTypes = {
  ClassMethod: {
    key: "if computed then `Expression` else `Identifier | Literal`",
  },
  Identifier: {
    name: "`string`",
  },
  MemberExpression: {
    property: "if computed then `Expression` else `Identifier`",
  },
  ObjectMethod: {
    key: "if computed then `Expression` else `Identifier | Literal`",
  },
  ObjectProperty: {
    key: "if computed then `Expression` else `Identifier | Literal`",
  },
};
Object.keys(t.BUILDER_KEYS)
  .sort()
  .forEach(function (key) {
    readme.push("### " + key[0].toLowerCase() + key.substr(1));
    readme.push("```javascript");
    readme.push(
      "t." + toFunctionName(key) + "(" + t.BUILDER_KEYS[key].join(", ") + ")"
    );
    readme.push("```");
    readme.push("");
    readme.push(
      "See also `t.is" +
        key +
        "(node, opts)` and `t.assert" +
        key +
        "(node, opts)`."
    );
    readme.push("");
    if (t.ALIAS_KEYS[key] && t.ALIAS_KEYS[key].length) {
      readme.push(
        "Aliases: " +
          t.ALIAS_KEYS[key]
            .map(function (key) {
              return "`" + key + "`";
            })
            .join(", ")
      );
      readme.push("");
    }
    Object.keys(t.NODE_FIELDS[key])
      .sort(function (fieldA, fieldB) {
        const indexA = t.BUILDER_KEYS[key].indexOf(fieldA);
        const indexB = t.BUILDER_KEYS[key].indexOf(fieldB);
        if (indexA === indexB) return fieldA < fieldB ? -1 : 1;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
      .forEach(function (field) {
        const defaultValue = t.NODE_FIELDS[key][field].default;
        const fieldDescription = ["`" + field + "`"];
        const validator = t.NODE_FIELDS[key][field].validate;
        if (customTypes[key] && customTypes[key][field]) {
          fieldDescription.push(`: ${customTypes[key][field]}`);
        } else if (validator) {
          try {
            fieldDescription.push(
              ": `" + stringifyValidator(validator, "") + "`"
            );
          } catch (ex) {
            if (ex.code === "UNEXPECTED_VALIDATOR_TYPE") {
              console.log(
                "Unrecognised validator type for " + key + "." + field
              );
              console.dir(ex.validator, { depth: 10, colors: true });
            }
          }
        }
        if (defaultValue !== null || t.NODE_FIELDS[key][field].optional) {
          fieldDescription.push(
            " (default: `" + util.inspect(defaultValue) + "`"
          );
          if (t.BUILDER_KEYS[key].indexOf(field) < 0) {
            fieldDescription.push(", excluded from builder function");
          }
          fieldDescription.push(")");
        } else {
          fieldDescription.push(" (required)");
        }
        readme.push(" - " + fieldDescription.join(""));
      });

    readme.push("");
    readme.push("---");
    readme.push("");
  });

process.stdout.write(readme.join("\n"));
