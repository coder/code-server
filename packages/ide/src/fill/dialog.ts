import { IDisposable } from "@coder/disposable";
import { Emitter } from "@coder/events";

import "./dialog.scss";

/**
 * Dialog options.
 */
export interface IDialogOptions {
	message?: string;
	detail?: string;
	buttons?: string[];
	input?: {
		value: string;
		selection?: {
			start: number;
			end: number;
		};
	};
}

export interface IDialogAction {
	buttonIndex?: number;
	key?: IKey;
}

/**
 * Pressed keys.
 */
export enum IKey {
	Enter = "Enter",
	Escape = "Escape",
}

export class Dialog {

	private options: IDialogOptions;
	private overlay: HTMLElement;
	private cachedActiveElement: HTMLElement | undefined;
	private input: HTMLInputElement | undefined;
	private actionEmitter: Emitter<IDialogAction>;
	private errors: HTMLElement;
	private buttons: HTMLElement[] | undefined;

	public constructor(options: IDialogOptions) {
		this.options = options;

		this.actionEmitter = new Emitter();

		const msgBox = document.createElement("div");
		msgBox.classList.add("msgbox");

		if (this.options.message) {
			const messageDiv = document.createElement("div");
			messageDiv.classList.add("msg");
			messageDiv.innerText = this.options.message;
			msgBox.appendChild(messageDiv);
		}

		if (this.options.detail) {
			const detailDiv = document.createElement("div");
			detailDiv.classList.add("detail");
			detailDiv.innerText = this.options.detail;
			msgBox.appendChild(detailDiv);
		}

		if (this.options.input) {
			msgBox.classList.add("input");
			this.input = document.createElement("input");
			this.input.classList.add("input");
			this.input.value = this.options.input.value;
			this.input.addEventListener("keydown", (event) => {
				if (event.key === IKey.Enter) {
					event.preventDefault();
					this.actionEmitter.emit({
						buttonIndex: undefined,
						key: IKey.Enter,
					});
				}
			});
			msgBox.appendChild(this.input);
		}

		this.errors = document.createElement("div");
		this.errors.classList.add("errors");
		msgBox.appendChild(this.errors);

		if (this.options.buttons && this.options.buttons.length > 0) {
			this.buttons = this.options.buttons.map((buttonText, buttonIndex) => {
				const button = document.createElement("button");
				button.innerText = buttonText;
				button.addEventListener("click", () => {
					this.actionEmitter.emit({
						buttonIndex,
						key: undefined,
					});
				});

				return button;
			});

			const buttonWrapper = document.createElement("div");
			buttonWrapper.classList.add("button-wrapper");
			this.buttons.forEach((b) => buttonWrapper.appendChild(b));
			msgBox.appendChild(buttonWrapper);
		}

		this.overlay = document.createElement("div");
		this.overlay.className = "msgbox-overlay";
		this.overlay.appendChild(msgBox);

		setTimeout(() => {
			this.overlay.style.opacity = "1";
		});
	}

	/**
	 * Register a function to be called when the user performs an action.
	 */
	public onAction(callback: (action: IDialogAction) => void): IDisposable {
		return this.actionEmitter.event(callback);
	}

	/**
	 * Input value if this dialog has an input.
	 */
	public get inputValue(): string | undefined {
		return this.input ? this.input.value : undefined;
	}

	/**
	 * Display or remove an error.
	 */
	public set error(error: string | undefined) {
		while (this.errors.lastChild) {
			this.errors.removeChild(this.errors.lastChild);
		}
		if (error) {
			const errorDiv = document.createElement("error");
			errorDiv.innerText = error;
			this.errors.appendChild(errorDiv);
		}
	}

	/**
	 * Show the dialog.
	 */
	public show(): void {
		if (!this.cachedActiveElement) {
			this.cachedActiveElement = document.activeElement as HTMLElement;
			document.body.appendChild(this.overlay);
			document.addEventListener("keydown", this.onKeydown);
			if (this.input) {
				this.input.focus();
				if (this.options.input && this.options.input.selection) {
					this.input.setSelectionRange(
						this.options.input.selection.start,
						this.options.input.selection.end,
					);
				}
			} else if (this.buttons) {
				this.buttons[0].focus();
			}
		}
	}

	/**
	 * Remove the dialog and clean up.
	 */
	public hide(): void {
		if (this.cachedActiveElement) {
			this.overlay.remove();
			document.removeEventListener("keydown", this.onKeydown);
			this.cachedActiveElement.focus();
			this.cachedActiveElement = undefined;
		}
	}

	/**
	 * Capture escape.
	 */
	private onKeydown = (event: KeyboardEvent): void => {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			this.actionEmitter.emit({
				buttonIndex: undefined,
				key: IKey.Escape,
			});
		}
	}

}
