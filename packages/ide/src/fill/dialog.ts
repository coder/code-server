import { Emitter } from "@coder/events";

import "./dialog.scss";

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

export enum IKey {
	Enter = "Enter",
	Escape = "Escape",
}

export class Dialog {
	private readonly overlay: HTMLElement;
	private cachedActiveElement: HTMLElement | undefined;
	private input: HTMLInputElement | undefined;
	private errors: HTMLElement;
	private buttons: HTMLElement[] | undefined;
	private readonly msgBox: HTMLElement;

	private actionEmitter = new Emitter<IDialogAction>();
	public onAction = this.actionEmitter.event;

	public constructor(private readonly options: IDialogOptions) {
		this.msgBox = document.createElement("div");
		this.msgBox.classList.add("msgbox");

		if (this.options.message) {
			const messageDiv = document.createElement("div");
			messageDiv.classList.add("msg");
			messageDiv.innerText = this.options.message;
			this.msgBox.appendChild(messageDiv);
		}

		if (this.options.detail) {
			const detailDiv = document.createElement("div");
			detailDiv.classList.add("detail");
			detailDiv.innerText = this.options.detail;
			this.msgBox.appendChild(detailDiv);
		}

		if (this.options.input) {
			this.msgBox.classList.add("input");
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
			this.msgBox.appendChild(this.input);
		}

		this.errors = document.createElement("div");
		this.errors.classList.add("errors");

		if (this.options.buttons && this.options.buttons.length > 0) {
			this.buttons = this.options.buttons.map((buttonText, buttonIndex) => {
				const button = document.createElement("button");
				// TODO: support mnemonics.
				button.innerText = buttonText.replace("&&", "");
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
			this.msgBox.appendChild(buttonWrapper);
		}

		this.overlay = document.createElement("div");
		this.overlay.className = "msgbox-overlay";
		this.overlay.appendChild(this.msgBox);

		setTimeout(() => {
			this.overlay.style.opacity = "1";
		});
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
			this.msgBox.appendChild(this.errors);
		}
	}

	/**
	 * Show the dialog.
	 */
	public show(): void {
		if (!this.cachedActiveElement) {
			this.cachedActiveElement = document.activeElement as HTMLElement;
			(document.querySelector(".monaco-workbench") || document.body).appendChild(this.overlay);
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
