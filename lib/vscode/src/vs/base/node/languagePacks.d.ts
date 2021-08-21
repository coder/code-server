/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface NLSConfiguration {
	locale: string;
	availableLanguages: {
		[key: string]: string;
	};
	pseudo?: boolean;
	_languagePackSupport?: boolean;
}

export type LoadBundleCallback = (_: undefined, result?: string) => void;

export interface InternalNLSConfiguration extends NLSConfiguration {
	_languagePackId: string;
	_translationsConfigFile: string;
	_cacheRoot: string;
	_resolvedLanguagePackCoreLocation: string;
	_corruptedFile: string;
	_languagePackSupport?: boolean;
	loadBundle?: (bundle: string, _language: string, cb: LoadBundleCallback) => void;
}

export function getNLSConfiguration(commit: string, userDataPath: string, metaDataFile: string, locale: string): Promise<NLSConfiguration>;
