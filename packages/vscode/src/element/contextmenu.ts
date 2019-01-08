/**
 * SHOULD BE MOVED. THIS IS NOT A UI SECTION
 */

import * as augment from './augment';
import "./contextmenu.css";
import { FastDomNode, createFastDomNode } from 'vs/base/browser/fastDomNode';

export enum MenuItemType {
	COMMAND,
	SUB_MENU,
	SPACER,
	CUSTOM_ITEM,
	GENERATIVE_SUBMENU,
}

export interface IMenuItem {
	type: MenuItemType;
	domNode: HTMLElement;
	priority: number;
	selectOnHover: boolean;
	refreshDomNode?: () => void;
	isSelectable?: (() => boolean) | boolean;
	onSelect?: () => void;
}

export class ContextMenuManager {

	private readonly domNode: FastDomNode<HTMLDivElement>;

	public constructor() {
		this.domNode = createFastDomNode(document.createElement("div"));
		this.domNode.setClassName("context-menu-overlay");
		// this.display = false;
		this.domNode.domNode.addEventListener("mousedown", (event) => {
			event.preventDefault();
			if (event.target === this.domNode.domNode) {
				this.display = false;
			}
		});
		this.domNode.domNode.addEventListener("closeAllContextMenus", (event) => {
			this.display = false;
			event.stopPropagation();
		});
		this.domNode.domNode.addEventListener("contextMenuActive", (event) => {
			// this.clearStackTill(event.target as HTMLElement);
			event.stopPropagation();
		});
	}

	public onceClose(cb: () => void): void {
		const l = () => {
			cb();
			this.domNode.domNode.removeEventListener("closed", l);
		};
		this.domNode.domNode.addEventListener("closed", l);
	}

	public set display(value: boolean) {
		if (value) {
			document.body.appendChild(this.domNode.domNode);
		} else {
			this.domNode.domNode.remove();
			this.domNode.domNode.dispatchEvent(new Event("closed"));
		}
	}

	public displayMenuAtBoundary<T>(
		menu: ContextMenu,
		boundary: augment.IBoundary,
		positioning: augment.BoundaryPos = ["BOTTOM", "RIGHT"],
		clearStack: boolean = true,
	): void {
		this.displayMenu(menu, clearStack);
		menu.positioningAugment.moveToBoundary(boundary, positioning);
	}

	public displayMenuAtPoint<T>(
		menu: ContextMenu,
		point: { top: number, left: number },
		positioning: augment.PointPos = ["RIGHT", "BOTTOM"],
		clearStack: boolean = true,
	): void {
		this.displayMenu(menu, clearStack);
		menu.positioningAugment.moveToPoint(point, positioning);
	}

	private displayMenu(menu: ContextMenu, clearStack: boolean) {
		while (this.domNode.domNode.lastChild) {
			this.domNode.domNode.removeChild(this.domNode.domNode.lastChild);
		}
		this.domNode.appendChild(menu.domNode);
		this.display = true;
	}

}

export class ContextMenu {

	public readonly id: string;
	public readonly positioningAugment: augment.FloaterPositioning;
	public readonly selectionAugment: augment.SelectableChildren;
	public readonly domNode: FastDomNode<HTMLDivElement>;
	private readonly manager: ContextMenuManager;

	private cachedActive: HTMLElement;
	private domNodeToItemMap: Map<HTMLElement, IMenuItem>;
	private items: IMenuItem[];

	constructor(id: string, manager: ContextMenuManager) {
		this.id = id;
		this.manager = manager;
		this.items = [];
		this.domNodeToItemMap = new Map();
		this.domNode = createFastDomNode(document.createElement("div"));
		this.domNode.setClassName("command-menu");
		this.positioningAugment = new augment.FloaterPositioning(this.domNode.domNode);

		const selectOnHover = (itemDomNode: HTMLElement) => this.domNodeToItemMap.get(itemDomNode).selectOnHover;
		this.selectionAugment = new augment.SelectableChildren(this.domNode.domNode, {
			isItemSelectable: (itemDomNode) => {
				const item = this.domNodeToItemMap.get(itemDomNode);
				return typeof item.isSelectable === "boolean" ? item.isSelectable : item.isSelectable();
			},
			onHover: (itemDomNode) => {
				const item = this.domNodeToItemMap.get(itemDomNode);
				if (item.type !== MenuItemType.SUB_MENU && item.type !== MenuItemType.GENERATIVE_SUBMENU) {
					this.domNode.domNode.dispatchEvent(new Event("contextMenuActive", { bubbles: true }));
					this.selectionAugment.unsetSelection();
				}
			},
			onSelect: (itemDomNode) => {
				const item = this.domNodeToItemMap.get(itemDomNode);
				if (item.onSelect) { item.onSelect(); }
			},
			selectOnKeyHover: selectOnHover,
			selectOnMouseHover: selectOnHover,
		});
	}

	public set display(onOff: boolean) {
		if (onOff === true) {
			this.cachedActive = document.activeElement as HTMLElement;
			if (this.cachedActive) {
				this.cachedActive.blur();
			}
			this.items.forEach((item) => !!item.refreshDomNode ? item.refreshDomNode() : null);
			this.selectionAugment.updateAllItemIsSelectableStates();
		} else if (this.cachedActive) {
			this.cachedActive.focus();
			this.cachedActive = null;
		}
		this.domNode.domNode.style.display = onOff ? "" : "none";
	}

	public addSpacer(priority: number) {
		const rootNode = createFastDomNode(document.createElement("div"));
		rootNode.setClassName("menuitem spacer");
		const hrNode = createFastDomNode(document.createElement("hr"));
		rootNode.appendChild(hrNode);
		this.appendMenuItem({
			domNode: rootNode.domNode,
			isSelectable: false,
			priority,
			selectOnHover: false,
			type: MenuItemType.SPACER,
		});
	}

	public addEntry(priority: number, label: string, accelerator: string, enabled: boolean, callback: () => void) {
		const domNode = createFastDomNode(document.createElement("div"));
		domNode.setClassName("menuitem entry");
		const labelNode = createFastDomNode(document.createElement("div"));
		labelNode.setClassName("entrylabel");
		labelNode.domNode.innerText = label;
		domNode.appendChild(labelNode);

		if (accelerator) {
			const accelNode = createFastDomNode(document.createElement("div"));
			accelNode.setClassName("keybind");
			accelNode.domNode.innerText = accelerator;
			domNode.appendChild(accelNode);
		}


		const menuItem: IMenuItem = {
			domNode: domNode.domNode,
			isSelectable: () => enabled,
			onSelect: () => {
				if (this.cachedActive) {
					this.cachedActive.focus();
					this.cachedActive = null;
				}
				callback();
				domNode.domNode.dispatchEvent(new Event("closeAllContextMenus", { bubbles: true }));
			},
			priority,
			selectOnHover: false,
			type: MenuItemType.COMMAND,
		};
		this.appendMenuItem(menuItem);
	}

	public addSubMenu(priority: number, subMenu: ContextMenu, label: string, description?: string) {
		const rootNode = createFastDomNode(document.createElement("div"));
		rootNode.setClassName("menuitem");
		const subLabel = createFastDomNode(document.createElement("div"));
		subLabel.setClassName("seg submenulabel");
		subLabel.domNode.innerText = label;
		const subArrow = createFastDomNode(document.createElement("div"));
		subArrow.setClassName("seg submenuarrow");
		subArrow.domNode.innerText = "->";
		rootNode.appendChild(subLabel);
		rootNode.appendChild(subArrow);
		this.appendMenuItem({
			domNode: rootNode.domNode,
			isSelectable: true,
			onSelect: () => {
				this.manager.displayMenuAtBoundary(subMenu, rootNode.domNode.getBoundingClientRect(), ["RIGHT", "BOTTOM"], false);
			},
			priority,
			selectOnHover: true,
			type: MenuItemType.SUB_MENU,
		});
	}

	// used for generative sub menu... needs to be less public
	public removeAllItems() {
		while (this.items.length) {
			const removeMe = this.items.pop();
			removeMe.domNode.remove();
		}
	}

	private appendMenuItem(item: IMenuItem) {
		this.items.push(item);
		this.domNodeToItemMap.set(item.domNode, item);
		this.selectionAugment.registerChild(item.domNode);
		this.items = this.items.sort((a, b) => a.priority - b.priority);
		this.sortDomNode();
	}

	private sortDomNode() {
		while (this.domNode.domNode.lastChild) {
			this.domNode.domNode.removeChild(this.domNode.domNode.lastChild);
		}
		this.items.forEach((item) => this.domNode.domNode.appendChild(item.domNode));
	}

}
