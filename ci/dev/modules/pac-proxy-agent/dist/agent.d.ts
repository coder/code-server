/// <reference types="node" />
import { Readable } from 'stream';
import { FindProxyForURL } from 'pac-resolver';
import { Agent, AgentCallbackReturn, ClientRequest, RequestOptions } from 'agent-base';
import { PacProxyAgentOptions } from '.';
/**
 * The `PacProxyAgent` class.
 *
 * A few different "protocol" modes are supported (supported protocols are
 * backed by the `get-uri` module):
 *
 *   - "pac+data", "data" - refers to an embedded "data:" URI
 *   - "pac+file", "file" - refers to a local file
 *   - "pac+ftp", "ftp" - refers to a file located on an FTP server
 *   - "pac+http", "http" - refers to an HTTP endpoint
 *   - "pac+https", "https" - refers to an HTTPS endpoint
 *
 * @api public
 */
export default class PacProxyAgent extends Agent {
    uri: string;
    opts: PacProxyAgentOptions;
    cache?: Readable;
    resolver?: FindProxyForURL;
    resolverHash: string;
    resolverPromise?: Promise<FindProxyForURL>;
    constructor(uri: string, opts?: PacProxyAgentOptions);
    private clearResolverPromise;
    /**
     * Loads the PAC proxy file from the source if necessary, and returns
     * a generated `FindProxyForURL()` resolver function to use.
     *
     * @api private
     */
    private getResolver;
    private loadResolver;
    /**
     * Loads the contents of the PAC proxy file.
     *
     * @api private
     */
    private loadPacFile;
    /**
     * Called when the node-core HTTP client library is creating a new HTTP request.
     *
     * @api protected
     */
    callback(req: ClientRequest, opts: RequestOptions): Promise<AgentCallbackReturn>;
}
