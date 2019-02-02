import * as dom from "vs/base/browser/dom";
import { IDisposable } from "vs/base/common/lifecycle";

// Firefox has no implementation of toElement.
if (!("toElement" in MouseEvent.prototype)) {
	Object.defineProperty(MouseEvent.prototype, "toElement", {
		get: function (): EventTarget | null {
			// @ts-ignore
			const event = this as MouseEvent;
			switch (event.type) {
				case "mouseup":
				case "focusin":
				case "mousenter":
				case "mouseover":
				case "dragenter":
					return event.target;
				default:
					return event.relatedTarget;
			}
		},
	});
}

const _addDisposableListener = dom.addDisposableListener;
// tslint:disable-next-line no-any
const addDisposableListener = (node: Element | Window | Document, type: string, handler: (event: any) => void, useCapture?: boolean): IDisposable => {
	return _addDisposableListener(node, type === "mousewheel" ? "wheel" : type, handler, useCapture);
};

const target = dom as typeof dom;
target.addDisposableListener = addDisposableListener;
