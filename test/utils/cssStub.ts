// Note: this is needed for the register.test.ts
// This is because inside src/browser/register.ts
// we import CSS files, which Jest can't handle unless we tell it how to
// See: https://stackoverflow.com/a/39434579/3015595
module.exports = {}
