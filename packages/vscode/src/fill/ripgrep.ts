import * as path from "path";

// tslint:disable-next-line:no-any
module.exports.rgPath = (<any>global).RIPGREP_LOCATION || path.join(__dirname, "../bin/rg");
