import "./firefox.scss";

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
