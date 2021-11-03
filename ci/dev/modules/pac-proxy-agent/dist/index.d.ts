import { AgentOptions } from 'agent-base';
import { PacResolverOptions } from 'pac-resolver';
import { HttpProxyAgentOptions } from 'http-proxy-agent';
import { HttpsProxyAgentOptions } from 'https-proxy-agent';
import { SocksProxyAgentOptions } from 'socks-proxy-agent';
import _PacProxyAgent from './agent';
declare function createPacProxyAgent(uri: string, opts?: createPacProxyAgent.PacProxyAgentOptions): _PacProxyAgent;
declare function createPacProxyAgent(opts: createPacProxyAgent.PacProxyAgentOptions): _PacProxyAgent;
declare namespace createPacProxyAgent {
    interface PacProxyAgentOptions extends AgentOptions, PacResolverOptions, HttpProxyAgentOptions, HttpsProxyAgentOptions, SocksProxyAgentOptions {
        uri?: string;
        fallbackToDirect?: boolean;
    }
    type PacProxyAgent = _PacProxyAgent;
    const PacProxyAgent: typeof _PacProxyAgent;
    /**
     * Supported "protocols". Delegates out to the `get-uri` module.
     */
    const protocols: string[];
}
export = createPacProxyAgent;
