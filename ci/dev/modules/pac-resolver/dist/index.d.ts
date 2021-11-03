/// <reference types="node" />
import { Context } from 'vm';
import { CompileOptions } from 'degenerator';
/**
 * Returns an asynchronous `FindProxyForURL()` function
 * from the given JS string (from a PAC file).
 *
 * @param {String} str JS string
 * @param {Object} opts optional "options" object
 * @return {Function} async resolver function
 */
declare function createPacResolver(_str: string | Buffer, _opts?: createPacResolver.PacResolverOptions): {
    (url: string, host?: string | undefined): Promise<string>;
    (url: string, callback: createPacResolver.FindProxyForURLCallback): void;
    (url: string, host: string, callback: createPacResolver.FindProxyForURLCallback): void;
};
declare namespace createPacResolver {
    type GMT = 'GMT';
    type Hour = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;
    type Day = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31;
    type Weekday = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
    type Month = 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC';
    interface PacResolverOptions extends CompileOptions {
    }
    interface FindProxyForURLCallback {
        (err?: Error | null, result?: string): void;
    }
    type FindProxyForURL = ReturnType<typeof createPacResolver>;
    const sandbox: Readonly<Context>;
}
export = createPacResolver;
