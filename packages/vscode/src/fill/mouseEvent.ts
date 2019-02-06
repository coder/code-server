import * as mouse from "vs/base/browser/mouseEvent";

/**
 * Fix the wheel event for Firefox.
 */
class StandardWheelEvent extends mouse.StandardWheelEvent {
	public constructor(event: mouse.IMouseWheelEvent | null) {
		super(
			event,
			(-(event as any as MouseWheelEvent).deltaX || 0) / 3, // tslint:disable-line no-any
			(-(event as any as MouseWheelEvent).deltaY || 0) / 3, // tslint:disable-line no-any
		);
	}
}

const target = mouse as typeof mouse;
target.StandardWheelEvent = StandardWheelEvent;
