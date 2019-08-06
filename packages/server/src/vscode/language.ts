import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import { logger } from "@coder/logger";
import * as lp from "vs/base/node/languagePacks";

// @www.ps.dev
// NOTE: This code was pulled from lib/vscode/src/main.js.

const stripComments = (content: string): string => {
    const regexp = /("(?:[^\\"]*(?:\\.)?)*")|('(?:[^\\']*(?:\\.)?)*')|(\/\*(?:\r?\n|.)*?\*\/)|(\/{2,}.*?(?:(?:\r?\n)|$))/g;

    return content.replace(regexp, (match, _m1, _m2, m3, m4) => {
        if (m3) { // Only one of m1, m2, m3, m4 matches.
            return ""; // A block comment. Replace with nothing.
        } else if (m4) { // A line comment. If it ends in \r?\n then keep it.
            const length_1 = m4.length;
            if (length_1 > 2 && m4[length_1 - 1] === "\n") {
                return m4[length_1 - 2] === "\r" ? "\r\n" : "\n";
            } else {
                return "";
            }
        } else {
            return match; // We match a string.
        }
    });
};

/**
 * Get the locale from the locale file.
 */
const getUserDefinedLocale = async (userDataPath: string): Promise<string | undefined> => {
    const localeConfig = path.join(userDataPath, "User/locale.json");

    try {
        const content = stripComments(await util.promisify(fs.readFile)(localeConfig, "utf8"));
        const value = JSON.parse(content).locale;

        return value && typeof value === "string" ? value.toLowerCase() : undefined;
    } catch (e) {
        return undefined;
    }
};

// @www.ps.dev
export interface NewInternalNLSConfiguration extends lp.InternalNLSConfiguration {
    languageTranslateData?: object;
}

export const getNlsConfiguration = (userDataPath: string, builtInDirectory: string): Promise<lp.NLSConfiguration> => {
    const defaultConfig = { locale: "en", availableLanguages: {} };

    return new Promise(async (resolve): Promise<void> => {
        try {
            const metaDataFile = require("path").join(builtInDirectory, "nls.metadata.json");
            const locale = await getUserDefinedLocale(userDataPath);
            if (!locale) {
                logger.debug("No locale, using default");

                return resolve(defaultConfig);
            }

            const config = (await lp.getNLSConfiguration(
                process.env.VERSION || "development", userDataPath,
                metaDataFile, locale,
            )) || defaultConfig;

            (config as NewInternalNLSConfiguration)._languagePackSupport = true;

            // @www.ps.dev
            if (locale !== 'en') {
                let languageTranslateData: any = {};
                let languagepacksPath = userDataPath + "/languagepacks.json";
                let languagepacks = fs.readFileSync(languagepacksPath, "utf-8");
                let languageTranslations = JSON.parse(languagepacks);

                if(languageTranslations.hasOwnProperty(locale)) {
                    for (const fileKey in languageTranslations[locale].translations) {
                        let translateContent = fs.readFileSync(languageTranslations[locale].translations[fileKey], "utf-8");

                        let ls: any = {};
                        let translateData = JSON.parse(translateContent);
                        for (let tr in translateData.contents) {
                            for(const key in translateData.contents[tr]) {
                                ls[key] = translateData.contents[tr][key];
                            }
                        }
                        languageTranslateData[fileKey] = ls;
                    }
                }
                (config as NewInternalNLSConfiguration).languageTranslateData = languageTranslateData;
            }
            // end
            // logger.debug(`Locale is ${locale}`, config);
            resolve(config);
        } catch (error) {
            logger.error(error.message);
            resolve(defaultConfig);
        }
    });
};
