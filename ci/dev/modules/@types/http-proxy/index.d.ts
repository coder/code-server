// Type definitions for node-http-proxy 1.17
// Project: https://github.com/nodejitsu/node-http-proxy
// Definitions by: Maxime LUCE <https://github.com/SomaticIT>
//                 Florian Oellerich <https://github.com/Raigen>
//                 Daniel Schmidt <https://github.com/DanielMSchmidt>
//                 Jordan Abreu <https://github.com/jabreu610>
//                 Samuel Bodin <https://github.com/bodinsamuel>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.1

/// <reference types="node" />

import * as net from "net";
import * as http from "http";
import * as https from "https";
import * as events from "events";
import * as url from "url";
import * as stream from "stream";

interface ProxyTargetDetailed {
    host: string;
    port: number;
    protocol?: string | undefined;
    hostname?: string | undefined;
    socketPath?: string | undefined;
    key?: string | undefined;
    passphrase?: string | undefined;
    pfx?: Buffer | string | undefined;
    cert?: string | undefined;
    ca?: string | undefined;
    ciphers?: string | undefined;
    secureProtocol?: string | undefined;
}

declare class Server extends events.EventEmitter {
    /**
     * Creates the proxy server with specified options.
     * @param options - Config object passed to the proxy
     */
    constructor(options?: Server.ServerOptions);

    /**
     * Used for proxying regular HTTP(S) requests
     * @param req - Client request.
     * @param res - Client response.
     * @param options - Additionnal options.
     */
    web(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        options?: Server.ServerOptions,
        callback?: Server.ErrorCallback,
    ): void;

    /**
     * Used for proxying regular HTTP(S) requests
     * @param req - Client request.
     * @param socket - Client socket.
     * @param head - Client head.
     * @param options - Additionnal options.
     */
    ws(
        req: http.IncomingMessage,
        socket: any,
        head: any,
        options?: Server.ServerOptions,
        callback?: Server.ErrorCallback,
    ): void;

    /**
     * A function that wraps the object in a webserver, for your convenience
     * @param port - Port to listen on
     */
    listen(port: number): Server;

    /**
     * A function that closes the inner webserver and stops listening on given port
     */
    close(callback?: () => void): void;

    /**
     * Creates the proxy server with specified options.
     * @param options Config object passed to the proxy
     * @returns Proxy object with handlers for `ws` and `web` requests
     */
    static createProxyServer(options?: Server.ServerOptions): Server;

    /**
     * Creates the proxy server with specified options.
     * @param options Config object passed to the proxy
     * @returns Proxy object with handlers for `ws` and `web` requests
     */
    static createServer(options?: Server.ServerOptions): Server;

    /**
     * Creates the proxy server with specified options.
     * @param options Config object passed to the proxy
     * @returns Proxy object with handlers for `ws` and `web` requests
     */
    static createProxy(options?: Server.ServerOptions): Server;

    addListener(event: string, listener: () => void): this;
    on(event: string, listener: () => void): this;
    on(event: "error", listener: Server.ErrorCallback): this;
    on(event: "start", listener: Server.StartCallback): this;
    on(event: "proxyReq", listener: Server.ProxyReqCallback): this;
    on(event: "proxyRes", listener: Server.ProxyResCallback): this;
    on(event: "proxyReqWs", listener: Server.ProxyReqWsCallback): this;
    on(event: "econnreset", listener: Server.EconnresetCallback): this;
    on(event: "end", listener: Server.EndCallback): this;
    on(event: "open", listener: Server.OpenCallback): this;
    on(event: "close", listener: Server.CloseCallback): this;

    once(event: string, listener: () => void): this;
    once(event: "error", listener: Server.ErrorCallback): this;
    once(event: "start", listener: Server.StartCallback): this;
    once(event: "proxyReq", listener: Server.ProxyReqCallback): this;
    once(event: "proxyRes", listener: Server.ProxyResCallback): this;
    once(event: "proxyReqWs", listener: Server.ProxyReqWsCallback): this;
    once(event: "econnreset", listener: Server.EconnresetCallback): this;
    once(event: "end", listener: Server.EndCallback): this;
    once(event: "open", listener: Server.OpenCallback): this;
    once(event: "close", listener: Server.CloseCallback): this;
    removeListener(event: string, listener: () => void): this;
    removeAllListeners(event?: string): this;
    getMaxListeners(): number;
    setMaxListeners(n: number): this;
    listeners(event: string): Array<() => void>;
    emit(event: string, ...args: any[]): boolean;
    listenerCount(type: string): number;
}

declare namespace Server {
    type ProxyTarget = ProxyTargetUrl | ProxyTargetDetailed;
    type ProxyTargetUrl = string | Partial<url.Url>;

    interface ServerOptions {
        /** URL string to be parsed with the url module. */
        target?: ProxyTarget | undefined;
        /** URL string to be parsed with the url module. */
        forward?: ProxyTargetUrl | undefined;
        /** Object to be passed to http(s).request. */
        agent?: any;
        /** Object to be passed to https.createServer(). */
        ssl?: any;
        /** If you want to proxy websockets. */
        ws?: boolean | undefined;
        /** Adds x- forward headers. */
        xfwd?: boolean | undefined;
        /** Verify SSL certificate. */
        secure?: boolean | undefined;
        /** Explicitly specify if we are proxying to another proxy. */
        toProxy?: boolean | undefined;
        /** Specify whether you want to prepend the target's path to the proxy path. */
        prependPath?: boolean | undefined;
        /** Specify whether you want to ignore the proxy path of the incoming request. */
        ignorePath?: boolean | undefined;
        /** Local interface string to bind for outgoing connections. */
        localAddress?: string | undefined;
        /** Changes the origin of the host header to the target URL. */
        changeOrigin?: boolean | undefined;
        /** specify whether you want to keep letter case of response header key */
        preserveHeaderKeyCase?: boolean | undefined;
        /** Basic authentication i.e. 'user:password' to compute an Authorization header. */
        auth?: string | undefined;
        /** Rewrites the location hostname on (301 / 302 / 307 / 308) redirects, Default: null. */
        hostRewrite?: string | undefined;
        /** Rewrites the location host/ port on (301 / 302 / 307 / 308) redirects based on requested host/ port.Default: false. */
        autoRewrite?: boolean | undefined;
        /** Rewrites the location protocol on (301 / 302 / 307 / 308) redirects to 'http' or 'https'.Default: null. */
        protocolRewrite?: string | undefined;
        /** rewrites domain of set-cookie headers. */
        cookieDomainRewrite?: false | string | { [oldDomain: string]: string } | undefined;
        /** rewrites path of set-cookie headers. Default: false */
        cookiePathRewrite?: false | string | { [oldPath: string]: string } | undefined;
        /** object with extra headers to be added to target requests. */
        headers?: { [header: string]: string } | undefined;
        /** Timeout (in milliseconds) when proxy receives no response from target. Default: 120000 (2 minutes) */
        proxyTimeout?: number | undefined;
        /** Timeout (in milliseconds) for incoming requests */
        timeout?: number | undefined;
        /** Specify whether you want to follow redirects. Default: false */
        followRedirects?: boolean | undefined;
        /** If set to true, none of the webOutgoing passes are called and it's your responsibility to appropriately return the response by listening and acting on the proxyRes event */
        selfHandleResponse?: boolean | undefined;
        /** Buffer */
        buffer?: stream.Stream | undefined;
    }

    type StartCallback = (req: http.IncomingMessage, res: http.ServerResponse, target: ProxyTargetUrl) => void;
    type ProxyReqCallback = (
        proxyReq: http.ClientRequest,
        req: http.IncomingMessage,
        res: http.ServerResponse,
        options: ServerOptions,
    ) => void;
    type ProxyResCallback = (
        proxyRes: http.IncomingMessage,
        req: http.IncomingMessage,
        res: http.ServerResponse,
    ) => void;
    type ProxyReqWsCallback = (
        proxyReq: http.ClientRequest,
        req: http.IncomingMessage,
        socket: net.Socket,
        options: ServerOptions,
        head: any,
    ) => void;
    type EconnresetCallback = (
        err: Error,
        req: http.IncomingMessage,
        res: http.ServerResponse,
        target: ProxyTargetUrl,
    ) => void;
    type EndCallback = (req: http.IncomingMessage, res: http.ServerResponse, proxyRes: http.IncomingMessage) => void;
    type OpenCallback = (proxySocket: net.Socket) => void;
    type CloseCallback = (proxyRes: http.IncomingMessage, proxySocket: net.Socket, proxyHead: any) => void;
    type ErrorCallback = (
        err: Error,
        req: http.IncomingMessage,
        res: http.ServerResponse,
        target?: ProxyTargetUrl,
    ) => void;
}

export = Server;
