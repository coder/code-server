
export function classSplice(element: HTMLElement, removeClasses: string, addClasses: string): HTMLElement {
	if (removeClasses) { removeClasses.split(/\s+/g).forEach((className) => element.classList.remove(className)); }
	if (addClasses) { addClasses.split(/\s+/g).forEach((className) => element.classList.add(className)); }
	return element;
}

export type Side = "LEFT" | "RIGHT" | "TOP" | "BOTTOM";
export type BoundaryPos = [Side, Side];
export interface IBoundary {
	top: number;
	left: number;
	right: number;
	bottom: number;
}

export type PointPos = ["LEFT" | "CENTER" | "RIGHT", "TOP" | "CENTER" | "BOTTOM"];

export class FloaterPositioning {
	private static positionClasses = [
		"--boundary_top_left",
		"--boundary_top_right",
		"--boundary_left_top",
		"--boundary_right_top",
		"--boundary_left_bottom",
		"--boundary_right_bottom",
		"--boundary_bottom_left",
		"--boundary_bottom_right",

		"--point_top_left",
		"--point_top_center",
		"--point_top_right",
		"--point_center_left",
		"--point_center_center",
		"--point_center_right",
		"--point_bottom_left",
		"--point_bottom_center",
		"--point_bottom_right",
	].join(" ");

	public readonly target: HTMLElement;
	constructor(target: HTMLElement) {
		this.target = target;
	}

	// this function was surprisingly difficult
	public moveToBoundary(boundary: IBoundary, pos: BoundaryPos, keepInBounds: boolean = true) {
		if (keepInBounds) {
			const height = this.target.offsetHeight;
			const width = this.target.offsetWidth;
			if (height === 0 && width === 0) {
				throw new Error("target must be added to page before it can be in bounds positioned");
			}
			const flip = {
				BOTTOM: "TOP",
				LEFT: "RIGHT",
				RIGHT: "LEFT",
				TOP: "BOTTOM",
			} as any;

			const getOverlap = (side: string, strong: boolean) => {
				switch (side) {
					case "BOTTOM": return ((strong ? boundary.bottom : boundary.top) + height) - window.innerHeight;
					case "TOP": return 0 - (strong ? boundary.top : boundary.bottom) - height;
					case "RIGHT": return ((strong ? boundary.right : boundary.left) + width) - window.innerWidth;
					case "LEFT": return 0 - (strong ? boundary.left : boundary.right) - width;
				}
			};

			const firstA = getOverlap(pos[0], true);
			if (firstA > 0) {
				const firstB = getOverlap(flip[pos[0]], true);
				if (firstB < firstA) {
					pos[0] = flip[pos[0]];
				}
			}

			const secA = getOverlap(pos[1], false);
			if (secA > 0) {
				const secB = getOverlap(flip[pos[1]], false);
				if (secB < secA) {
					pos[1] = flip[pos[1]];
				}
			}

		}

		classSplice(this.target, FloaterPositioning.positionClasses, undefined);
		this.target.classList.add(`--boundary_${pos.map((val) => val.toLowerCase()).join("_")}`);

		const displayPos: IBoundary = {} as any;
		switch (pos[0]) {
			case "BOTTOM": displayPos.top = boundary.bottom; break;
			case "TOP": displayPos.bottom = window.innerHeight - boundary.top; break;
			case "LEFT": displayPos.right = window.innerWidth - boundary.left; break;
			case "RIGHT": displayPos.left = boundary.right; break;
		}
		switch (pos[1]) {
			case "BOTTOM": displayPos.top = boundary.top; break;
			case "TOP": displayPos.bottom = window.innerHeight - boundary.bottom; break;
			case "LEFT": displayPos.right = window.innerWidth - boundary.right; break;
			case "RIGHT": displayPos.left = boundary.left; break;
		}
		this.applyPos(displayPos);
	}

	public moveToPoint(point: { top: number, left: number }, pos: PointPos, keepInBounds: boolean = true): void {
		if (keepInBounds) {
			const height = this.target.offsetHeight;
			const width = this.target.offsetWidth;
			if (height === 0 && width === 0) {
				throw new Error("target must be added to page before it can be in bounds positioned");
			}
			const flip = {
				BOTTOM: "TOP",
				LEFT: "RIGHT",
				RIGHT: "LEFT",
				TOP: "BOTTOM",
			} as any;

			const getOverlap = (side: string) => {
				switch (side) {
					case "BOTTOM": return (point.top + height) - window.innerHeight;
					case "TOP": return -1 * (point.top - height);
					case "RIGHT": return (point.left + width) - window.innerWidth;
					case "LEFT": return -1 * (point.left - width);
					default: return 0;
				}
			};

			const xAlign = pos[0];
			const normalXOffset = getOverlap(xAlign);
			if (normalXOffset > 0 && normalXOffset > getOverlap(flip[xAlign])) {
				pos[0] = flip[xAlign];
			}

			const yAlign = pos[1];
			const normalYOffset = getOverlap(yAlign);
			if (normalYOffset > 0 && normalYOffset > getOverlap(flip[yAlign])) {
				pos[1] = flip[yAlign];
			}
		}

		const displayPos: IBoundary = {} as any;
		let centerX = false;
		let centerY = false;
		switch (pos[0]) {
			case "CENTER": centerX = true;
			case "RIGHT": displayPos.left = point.left; break;
			case "LEFT": displayPos.right = window.innerWidth - point.left; break;
		}
		switch (pos[1]) {
			case "CENTER": centerY = true;
			case "BOTTOM": displayPos.top = point.top; break;
			case "TOP": displayPos.bottom = window.innerHeight - point.top; break;
		}

		classSplice(this.target, FloaterPositioning.positionClasses, undefined);
		this.target.classList.add(`--point_${pos.map((val) => val.toLowerCase()).reverse().join("_")}`);

		this.applyPos(displayPos);
		this.target.style.transform = `${centerX ? "translateX(-50)" : ""} ${centerY ? "translateY(-50)" : ""}`;
	}

	private applyPos(pos: IBoundary) {
		this.target.style.top = pos.top !== undefined ? (pos.top + "px") : "";
		this.target.style.bottom = pos.bottom !== undefined ? (pos.bottom + "px") : "";
		this.target.style.left = pos.left !== undefined ? (pos.left + "px") : "";
		this.target.style.right = pos.right !== undefined ? (pos.right + "px") : "";
	}
}

export type Boolable = ((item: HTMLElement) => boolean) | boolean;

export interface IMakeChildrenSelectableArgs {
	maxSelectable?: number;
	selectOnKeyHover?: Boolable;
	selectOnMouseHover?: Boolable;
	onHover?: (selectedItem: HTMLElement) => void;
	onSelect: (selectedItem: HTMLElement, wasAlreadySelected?: boolean) => void;
	isItemSelectable?: (item: HTMLElement) => boolean;
}

export class SelectableChildren {

	public readonly target: HTMLElement;
	private keyHoveredItem: HTMLElement;
	private _selectedItem: HTMLElement;
	private selectOnMouseHover: Boolable;
	private onHover: (selectedItem: HTMLElement) => void;
	private onSelect: (selectedItem: HTMLElement) => void;
	private isItemSelectable: (item: HTMLElement) => boolean;

	constructor(target: HTMLElement, args: IMakeChildrenSelectableArgs) {
		this.target = target;

		this.onHover = args.onHover;
		this.onSelect = args.onSelect;
		this.selectOnMouseHover = args.selectOnMouseHover || false;
		this.isItemSelectable = args.isItemSelectable;

		// this.target.addEventListener("keydown", (event) => this.onTargetKeydown(event));
		this.target.addEventListener("mousemove", (event) => this.onTargetMousemove(event));

		Array.from(this.target.children).forEach((child: HTMLElement) => this.registerChild(child));
	}

	public registerChild(child: HTMLElement) {
		child.addEventListener("mouseover", (event) => this.onItemHover(child, event));
		child.addEventListener("mousedown", (event) => this.onItemMousedown(child, event));
	}

	public get selectedItem() { return this._selectedItem; }

	public unsetSelection() {
		if (this.selectedItem) { this.selectedItem.classList.remove("--is_selected"); }
		this._selectedItem = undefined;
	}

	public trySelectItem(item: HTMLElement): boolean {
		if (this.checkItemSelectable(item) === false) { return false; }
		const alreadySelected = item === this.selectedItem;
		if (!alreadySelected) {
			this.unsetSelection();
			this._selectedItem = item;
			this.selectedItem.classList.add("--is_selected");
			this.onSelect(this.selectedItem);
		}
		return true;
	}

	public updateAllItemIsSelectableStates() {
		this.updateItemIsSelectableState(Array.from(this.target.childNodes) as any);
	}

	public updateItemIsSelectableState(itemOrItems?: HTMLElement | HTMLElement[]) {
		const items: HTMLElement[] = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];

		items.forEach((item) => {
			if (!this.isItemSelectable || this.isItemSelectable(item)) {
				item.classList.remove("--not_selectable");
			} else {
				item.classList.add("--not_selectable");
			}
		});
	}

	private checkItemSelectable(item: HTMLElement): boolean {
		this.updateItemIsSelectableState(item);
		return item.classList.contains("--not_selectable") === false;
	}

	private onTargetMousemove(event: MouseEvent) {
		classSplice(this.target, "--key_naving", "--mouse_naving");
		if (this.keyHoveredItem) {
			this.keyHoveredItem.classList.remove("--key_hovered");
			this.keyHoveredItem = undefined;
		}
	}

	private onItemHover(item: HTMLElement, event: Event) {
		if (this.onHover) { this.onHover(item); }
		if (
			this.checkItemSelectable(item)
				&& typeof this.selectOnMouseHover === "boolean"
				? this.selectOnMouseHover
				: (this.selectOnMouseHover as any)(item)
		) {
			this.trySelectItem(item);
		}
	}

	private onItemMousedown(item: HTMLElement, event: Event) {
		this.trySelectItem(item);
	}

}
