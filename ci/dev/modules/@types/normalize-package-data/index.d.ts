// Type definitions for normalize-package-data 2.4
// Project: https://github.com/npm/normalize-package-data#readme
// Definitions by: Jeff Dickey <https://github.com/jdxcode>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export = normalize;

declare function normalize(data: normalize.Input, warn?: normalize.WarnFn, strict?: boolean): void;
declare function normalize(data: normalize.Input, strict?: boolean): void;

declare namespace normalize {
    type WarnFn = (msg: string) => void;
    interface Input {[k: string]: any; }

    interface Person {
        name?: string;
        email?: string;
        url?: string;
    }

    interface Package {
        [k: string]: any;
        name: string;
        version: string;
        files?: string[];
        bin?: {[k: string]: string };
        man?: string[];
        keywords?: string[];
        author?: Person;
        maintainers?: Person[];
        contributors?: Person[];
        bundleDependencies?: {[name: string]: string; };
        dependencies?: {[name: string]: string; };
        devDependencies?: {[name: string]: string; };
        optionalDependencies?: {[name: string]: string; };
        description?: string;
        engines?: {[type: string]: string };
        license?: string;
        repository?: { type: string, url: string };
        bugs?: { url: string, email?: string } | { url?: string, email: string };
        homepage?: string;
        scripts?: {[k: string]: string};
        readme: string;
        _id: string;
    }
}
