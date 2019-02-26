import * as labels from "vs/base/common/labels";

// Here we simply disable translation of mnemonics and leave everything as &&.
// Since we're in the browser, we can handle all platforms in the same way.
const target = labels as typeof labels;
target.mnemonicMenuLabel = (label: string, forceDisable?: boolean): string => {
	return forceDisable ? label.replace(/\(&&\w\)|&&/g, "") : label;
};
target.mnemonicButtonLabel = (label:  string): string => { return label; };
target.unmnemonicLabel = (label:  string): string => { return label; };
