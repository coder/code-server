import * as path from "path";

export const isCli = typeof process.env.CLI !== "undefined" && process.env.CLI !== "false";
export const serveStatic = typeof process.env.SERVE_STATIC !== "undefined" && process.env.SERVE_STATIC !== "false";
export const buildDir = process.env.BUILD_DIR ? path.resolve(process.env.BUILD_DIR) : "";
