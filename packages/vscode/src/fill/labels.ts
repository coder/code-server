import * as labels from "vs/base/common/labels";

// Disable all mnemonics for now until we implement it.
const target = labels as typeof labels;
target.mnemonicMenuLabel = (label: string, forceDisable?: boolean): string => {
	return label.replace(/\(&&\w\)|&&/g, "");
};
target.mnemonicButtonLabel = (label:  string): string => {
	return label.replace(/\(&&\w\)|&&/g, "");
};
target.unmnemonicLabel = (label:  string): string => { return label; };
