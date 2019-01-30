import { CP } from "@coder/protocol";
import { client } from "./client";
import { promisify } from "./util";

const cp = new CP(client);

// tslint:disable-next-line no-any makes util.promisify return an object
(cp as any).exec[promisify.customPromisifyArgs] = ["stdout", "stderr"];

export = cp;
