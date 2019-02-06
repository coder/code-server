import { join } from "path";
import * as editor from "vs/editor/browser/services/codeEditorServiceImpl";
import { IDecorationRenderOptions } from "vs/editor/common/editorCommon";

/**
 * This converts icon paths for decorations to the correct URL.
 */
abstract class CodeEditorServiceImpl extends editor.CodeEditorServiceImpl {
	public registerDecorationType(key: string, options: IDecorationRenderOptions, parentTypeKey?: string): void {
		super.registerDecorationType(key, options ? {
			...options,
			gutterIconPath: options.gutterIconPath && options.gutterIconPath.scheme === "file" ? {
				...options.gutterIconPath,
				scheme: location.protocol.replace(":", ""),
				authority: location.host,
				path: join("/resource", options.gutterIconPath.path),
			} :options.gutterIconPath,
		} : {}, parentTypeKey);
	}
}

const target = editor as typeof editor;
target.CodeEditorServiceImpl = CodeEditorServiceImpl;
