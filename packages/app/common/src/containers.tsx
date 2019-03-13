//@ts-ignore
import { MDCRipple } from "@material/ripple";
//@ts-ignore
import { MDCTextField } from "@material/textfield";
//@ts-ignore
import { MDCLinearProgress } from "@material/linear-progress";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { RegisteredServer } from "./app";

// tslint:disable-next-line:no-any
declare var WebSettings: any;

interface AuthedUser {
	readonly username: string;
}

export class Main extends React.Component<void, {
	readonly view: "servers" | "add-server";
	readonly loading: boolean;
}> {
	private webview: HTMLWebViewElement | undefined;

	public constructor(props: void) {
		super(props);
		this.state = {
			view: "servers",
			loading: false,
		};
	}

	public componentDidMount(): void {
		window.addEventListener("message", (event) => {
			if (event.data === "back") {
				if (this.webview) {
					this.webview.classList.remove("active");
				}
			}
			if (event.data === "loaded") {
				if (this.webview) {
					// this.setState({ loading: false });
					// this.webview.classList.add("active");
				}
			}
		});

		if (this.webview) {
			this.webview.addEventListener("error", (event) => {
				console.error(event);
			});
			this.webview.addEventListener("loadstart", (event) => {
					this.setState({ loading: true });
			});
			this.webview.addEventListener("loadstop", (event) => {
				this.setState({ loading: false });
				this.webview!.classList.add("active");
				// tslint:disable-next-line:no-any
				const cw = (this.webview as any).contentWindow as Window;
				cw.postMessage("app", "*");
			});
		}
	}

	public render(): JSX.Element {
		return (
			<div className="main">
				<div className="header">
					<div className="shrinker">
						<Logo />
					</div>
				</div>
				<div className="content">
				{((): JSX.Element => {
					switch (this.state.view) {
						case "servers":
							return (
								<Servers servers={[
									{
										host: "coder",
										hostname: "--",
										name: "Coder",
									},
									{
										host: "self",
										hostname: "http://localhost:8080",
										name: "Dev Server",
									},
								]}
								user={{
									username: "Kyle",
								}}
								onSelect={(server): void => {
									if (this.webview) {
										this.webview.setAttribute("src", server.hostname);
									}
								}}
								onAddServer={() => this.setState({ view: "add-server" })}
								loading={this.state.loading}
								/>
							);
						case "add-server":
							return (
								<div>Add server</div>
							);
					}
				})()}
				</div>
				<webview ref={(wv: HTMLWebViewElement): HTMLWebViewElement => this.webview = wv}></webview>
			</div>
		);
	}
}

export class AddServer extends React.Component {
	public render(): JSX.Element {
		return (
			<div className="add-server">
				<h3>Add Server</h3>
				<p>Something about what you can do once you add your own server. A link to setup guides for this would be great as well.</p>
				<Input label="Address" id="address" />
				<br></br>
			</div>
		);
	}
}

export class Servers extends React.Component<{
	readonly user?: AuthedUser;
	readonly servers: ReadonlyArray<RegisteredServer>;
	readonly onSelect: (server: RegisteredServer) => void;
	readonly onAddServer: () => void;
	readonly loading: boolean;
}, {
	readonly refreshing: boolean;
}> {
	// tslint:disable-next-line:no-any
	public constructor(props: any) {
		super(props);
		this.state = {
			refreshing: false,
		};
	}

	public render(): JSX.Element {
		return (
			<div className="servers">
				<div className="header">
					<h3>Servers</h3>
					<Button onClick={(): void => this.props.onAddServer()} className="add-server" type="unelevated">Add Server</Button>
					<Ripple>
						<div className="refresh">
							<svg onClick={(): void => this.doRefresh()} className={this.state.refreshing ? "refreshing" : ""} width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
								<g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
									<g>
										<g transform="translate(4.000000, 4.000000)" fill="#2A2E37">
											<path d="M8,3 C9.179,3 10.311,3.423 11.205,4.17 L8.883,6.492 L15.094,7.031 L14.555,0.82 L12.625,2.75 C11.353,1.632 9.71,1 8,1 C4.567,1 1.664,3.454 1.097,6.834 L3.07,7.165 C3.474,4.752 5.548,3 8,3 Z" id="Path"></path>
											<path d="M8,13 C6.821,13 5.689,12.577 4.795,11.83 L7.117,9.508 L0.906,8.969 L1.445,15.18 L3.375,13.25 C4.647,14.368 6.29,15 8,15 C11.433,15 14.336,12.546 14.903,9.166 L12.93,8.835 C12.526,11.248 10.452,13 8,13 Z" id="Path"></path>
										</g>
										<rect id="Rectangle" fillRule="nonzero" x="0" y="0" width="24" height="24"></rect>
									</g>
								</g>
							</svg>
						</div>
					</Ripple>
				</div>
				<div className="grid">
					<div className="title status">
						Status
					</div>
					<div className="title servername">
						Server Name
					</div>
					<div className="title hostname">
						Hostname
					</div>
					<div className="title details">
						Details
					</div>
					<div className="title">
						{/* Used for continue/launch buttons */}
					</div>
					<div className="title">
						{/* Used for logout and delete buttons */}
					</div>

					<div role="progressbar" className={`mdc-linear-progress mdc-linear-progress--indeterminate ${this.props.loading ? "loading" : ""}`} ref={(d) => {
						if (d) new MDCLinearProgress(d)}}>
						<div className="mdc-linear-progress__buffering-dots"></div>
						<div className="mdc-linear-progress__buffer"></div>
						<div className="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
							<span className="mdc-linear-progress__bar-inner"></span>
						</div>
						<div className="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
							<span className="mdc-linear-progress__bar-inner"></span>
						</div>
					</div>

					{this.props.servers.map((server, i) => {
						return (
							<Server key={server.hostname + i} user={this.props.user} server={server} onSelect={(): void => this.props.onSelect(server)} />
						);
					})}
				</div>
			</div>
		);
	}

	private doRefresh(): void {
		if (this.state.refreshing) {
			return;
		}

		this.setState({
			refreshing: true,
		}, () => {
			setTimeout(() => {
				this.setState({
					refreshing: false,
				});
			}, 1500);
		});
	}
}

interface ServerProps {
	readonly user?: AuthedUser;
	readonly server: RegisteredServer;
	readonly onSelect: () => void;
}

export class Server extends React.Component<ServerProps, {
	readonly user?: AuthedUser;
	readonly status: "Online" | "Offline" | "Checking";
	readonly version: string;
}> {
	// tslint:disable-next-line:no-any
	public constructor(props: ServerProps) {
		super(props);
		this.state = {
			status: props.server.host === "coder" ? "Online" : "Checking",
			version: "",
		};
	}

	public componentWillMount(): void {
		if (this.props.server.host !== "self") {
			return;
		}

		const xhr = new XMLHttpRequest();
		xhr.open("GET", this.props.server.hostname);
		xhr.addEventListener("error", (err) => {
			this.setState({
				status: "Offline",
			});
		});
		xhr.addEventListener("loadend", () => {
			if (xhr.status === 200) {
				this.setState({
					status: "Online",
					version: process.env.VERSION,
				});
			} else {
				this.setState({
					status: "Offline",
				});
			}
		});
		xhr.send();
	}

	public render(): JSX.Element {
		return (
			<>
				<div className={`status value ${this.extraClasses}`}>
					{((): JSX.Element => {
						switch (this.state.status) {
							case "Offline":
								return (
									<svg width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
										<g id="Artboard-Copy-3" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
											<circle id="Oval" stroke="#2B343B" strokeWidth="1.5" fillRule="nonzero" cx="8" cy="8" r="7.25"></circle>
											<path d="M5.15444712,5.15444712 L10.8455529,10.8455529" id="Path-4" stroke="#2B343B" strokeWidth="1.5" fillRule="nonzero"></path>
											<path d="M5.15444712,5.15444712 L10.8455529,10.8455529" id="Path-4" stroke="#2B343B" strokeWidth="1.5" fillRule="nonzero" transform="translate(8.000000, 8.000000) scale(-1, 1) translate(-8.000000, -8.000000) "></path>
										</g>
									</svg>
								);
							case "Online":
								return (
									<svg width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
										<g id="Artboard-Copy-4" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
											<g id="checkmark-copy-21" fillRule="nonzero">
												<circle id="Oval" fill="#2B343B" cx="8" cy="8" r="8"></circle>
												<polyline id="Path-2" stroke="#FFFFFF" strokeWidth="1.5" points="3.46296296 8.62222222 6.05555556 11.1111111 12.537037 4.88888889"></polyline>
											</g>
										</g>
									</svg>
								);
							case "Checking":
								return (
									<svg width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
										<g id="Artboard-Copy-5" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
											<circle id="Oval" stroke="#2B343B" strokeWidth="1.5" fillRule="nonzero" cx="8" cy="8" r="7.25"></circle>
											<polyline id="Path" stroke="#2B343B" strokeWidth="1.5" points="7.90558664 4.63916767 7.90558664 8.63916767 11.9055866 8.63916767"></polyline>
										</g>
									</svg>
								);
							default:
								throw new Error("unsupported status");
						}
					})()}
					<span>
						{this.state.status}
					</span>
				</div>
				<div className={`servername value strong ${this.extraClasses}`}>
					{this.props.server.host === "coder" ? (
						<Logo />
					) : this.props.server.name}
				</div>
				<div className={`hostname value ${this.extraClasses}`}>
					{this.props.server.hostname}
				</div>
				<div className={`details value ${this.extraClasses}`}>
					{this.props.server.host === "coder" && this.props.user ? `Logged in as ${this.props.user.username}` : this.state.version}
				</div>
				<div className={`buttons value ${this.extraClasses}`}>
					<Button onClick={(): void => this.props.onSelect()} className="add-server" type="outlined">{this.props.server.host === "coder" ? "Continue" : "Launch"}</Button>
				</div>
				<div className={`icons value ${this.extraClasses}`}>
				<Ripple>
				<div>
					{this.props.server.host === "coder" ? (
						<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
						<g id="Artboard" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
							<g id="log-out-copy-2" transform="translate(4.000000, 4.000000)" fill="#2A2E37">
								<polygon id="Path" points="4 4 0 8 4 12 4 9 10 9 10 7 4 7"></polygon>
								<path d="M15,16 L6,16 C5.4,16 5,15.6 5,15 L5,12 L7,12 L7,14 L14,14 L14,2 L7,2 L7,4 L5,4 L5,1 C5,0.4 5.4,0 6,0 L15,0 C15.6,0 16,0.4 16,1 L16,15 C16,15.6 15.6,16 15,16 Z" id="Path"></path>
							</g>
						</g>
					</svg>
					) : (
					<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
						<g id="Artboard" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
							<g id="bin" transform="translate(4.000000, 4.000000)" fill="#2B343B">
								<rect id="Rectangle" x="5" y="7" width="2" height="6"></rect>
								<rect id="Rectangle" x="9" y="7" width="2" height="6"></rect>
								<path d="M12,1 C12,0.4 11.6,0 11,0 L5,0 C4.4,0 4,0.4 4,1 L4,3 L0,3 L0,5 L1,5 L1,15 C1,15.6 1.4,16 2,16 L14,16 C14.6,16 15,15.6 15,15 L15,5 L16,5 L16,3 L12,3 L12,1 Z M6,2 L10,2 L10,3 L6,3 L6,2 Z M13,5 L13,14 L3,14 L3,5 L13,5 Z" id="Shape" fillRule="nonzero"></path>
							</g>
						</g>
					</svg>
					)}
				</div>
				</Ripple>
				</div>
			</>
		);
	}

	private get extraClasses(): string {
		return this.props.server.host === "coder" ? "dark" : "";
	}
}

export class Input extends React.Component<{
	readonly label: string;
	readonly id: string;
	readonly type?: string;
}> {
	private wrapper: HTMLDivElement | undefined;

	public componentDidMount(): void {
		if (this.wrapper) {
			const textInput = new MDCTextField(this.wrapper);
		}
	}

	public render(): JSX.Element {
		return (
			<div className="mdc-text-field mdc-text-field--outlined" ref={(i: HTMLDivElement): HTMLDivElement => this.wrapper = i}>
				<input type={this.props.type || "text"} id={this.props.id} className="mdc-text-field__input" spellCheck={false}></input>
				<div className="mdc-notched-outline">
					<div className="mdc-notched-outline__leading"></div>
					<div className="mdc-notched-outline__notch">
						<label htmlFor={this.props.id} className="mdc-floating-label">{this.props.label}</label>
					</div>
					<div className="mdc-notched-outline__trailing"></div>
				</div>
			</div>
		);
	}
}

export class Button extends React.Component<{
	readonly type: "outlined" | "unelevated";
	readonly className?: string;
	readonly onClick?: () => void;
}> {
	private button: HTMLButtonElement | undefined;

	public componentDidMount(): void {
		if (this.button) {
			const b = new MDCRipple(this.button);
		}
	}

	public render(): JSX.Element {
		return (
			<button onClick={() => this.props.onClick ? this.props.onClick() : undefined} className={`mdc-button mdc-button--${this.props.type} ${this.props.className || ""}`} ref={(b: HTMLButtonElement): HTMLButtonElement => this.button = b}>
				<span className="mdc-button__label">{this.props.children}</span>
			</button>
		);
	}
}

export class Tooltip extends React.Component<{
	readonly message: string;
}> {
	public componentDidMount(): void {
		Object.keys(this.refs).forEach((ref) => {
			const el = this.refs[ref];
			if (el) {
				const element = ReactDOM.findDOMNode(el);
				if (element) {
					const te = document.createElement("div");
					te.className = "md-tooltip-content";
					te.innerHTML = this.props.message;
					element.appendChild(te);
					(element as HTMLElement).classList.add("md-tooltip");
				}
			}
		});
	}

	public render(): JSX.Element {
		return (
			<>
			{React.Children.map(this.props.children, (element, idx) => {
				return React.cloneElement(element as any, { ref: idx });
			})}
			</>
		);
	}
}

export class Ripple extends React.Component<{
	readonly className?: string;
}> {
	public componentDidMount(): void {
		Object.keys(this.refs).forEach((ref) => {
			const el = this.refs[ref];
			if (el) {
				const element = ReactDOM.findDOMNode(el);
				if (element) {
					(element as HTMLElement).classList.add("mdc-ripple-surface");
					(element as HTMLElement).setAttribute("data-mdc-ripple-is-unbounded", "");
					const r = new MDCRipple(element);
				}
			}
		});
	}

	public render(): JSX.Element {
		return (
			<>
			{React.Children.map(this.props.children, (element, idx) => {
				return React.cloneElement(element as any, { ref: idx });
			})}
			</>
		);
	}
}

export class Logo extends React.Component {
	public render(): JSX.Element {
		return (
			<svg className="logo" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 471 117"
			style={{enableBackground: "new 0 0 471 117"} as any} xmlSpace="preserve">
<g>
	<g>
		<path className="logo-fill" d="M217,75.6c5.9,0,10.7-2.3,14.5-7l7.7,7.9c-6.1,6.9-13.3,10.3-21.6,10.3s-15.1-2.6-20.5-7.9
			C191.7,73.7,189,67,189,59s2.7-14.7,8.2-20s12.2-8,20.1-8c8.8,0,16.2,3.4,22.2,10.1l-7.5,8.5c-3.8-4.7-8.5-7.1-14.2-7.1
			c-4.5,0-8.4,1.5-11.6,4.4c-3.2,3-4.8,6.9-4.8,11.9s1.5,9,4.5,12.1C209,74.1,212.6,75.6,217,75.6z M284.1,46.7
			c-3.1-3.4-6.9-5.1-11.4-5.1s-8.3,1.7-11.4,5.1s-4.6,7.5-4.6,12.3s1.5,8.9,4.6,12.3s6.9,5,11.4,5s8.3-1.7,11.4-5
			c3.1-3.4,4.6-7.5,4.6-12.3S287.2,50.1,284.1,46.7z M272.7,86.8c-8,0-14.7-2.7-20.1-8s-8.2-11.9-8.2-19.9c0-7.9,2.7-14.5,8.2-19.9
			c5.4-5.3,12.2-8,20.1-8c8,0,14.7,2.7,20.1,8s8.2,11.9,8.2,19.9c0,7.9-2.7,14.5-8.2,19.9C287.4,84.1,280.7,86.8,272.7,86.8z
			 M352.3,39.4c5.1,4.7,7.7,11.2,7.7,19.6s-2.5,15-7.5,19.9s-12.7,7.3-22.9,7.3h-18.4V32.3h19C339.8,32.4,347.2,34.7,352.3,39.4z
			 M343.5,71.5c3-2.8,4.4-6.8,4.4-12.1s-1.5-9.4-4.4-12.2c-3-2.9-7.5-4.3-13.6-4.3h-6.7v32.8h7.6C336.3,75.6,340.5,74.2,343.5,71.5z
			 M409.3,32.4v10.7h-26.8v11.1h24.1v10.3h-24.1v11.2h27.7v10.6h-39.7V32.4H409.3L409.3,32.4z M464.6,50.3c0,8.6-3.4,14.2-10.3,16.7
			l13.6,19.3h-14.8l-11.9-17.2h-8.3v17.2h-12V32.4h20.4c8.4,0,14.4,1.4,17.9,4.2C462.8,39.4,464.6,44,464.6,50.3z M450.1,56.7
			c1.5-1.3,2.2-3.5,2.2-6.4s-0.8-4.9-2.3-6s-4.2-1.6-8.1-1.6h-9v16h8.8C445.8,58.7,448.6,58,450.1,56.7z"/>
	</g>
	<g>
		<path className="logo-fill" d="M164.8,50.9c-3.3,0-5.5-1.9-5.5-5.8V22.7c0-14.3-6-22.2-21.5-22.2h-7.2v15.1h2.2c6.1,0,9,3.3,9,9.2v19.8
			c0,8.6,2.6,12.1,8.3,13.9c-5.7,1.7-8.3,5.3-8.3,13.9c0,4.9,0,9.8,0,14.7c0,4.1,0,8.1-1.1,12.2c-1.1,3.8-2.9,7.4-5.4,10.5
			c-1.4,1.8-3,3.3-4.8,4.7v2h7.2c15.5,0,21.5-7.9,21.5-22.2V71.9c0-4,2.1-5.8,5.5-5.8h4.1V51h-4V50.9L164.8,50.9z"/>
		<path className="logo-fill" d="M115.8,23.3H93.6c-0.5,0-0.9-0.4-0.9-0.9v-1.7c0-0.5,0.4-0.9,0.9-0.9h22.3c0.5,0,0.9,0.4,0.9,0.9v1.7
			C116.8,22.9,116.3,23.3,115.8,23.3z"/>
		<path className="logo-fill" d="M119.6,44.9h-16.2c-0.5,0-0.9-0.4-0.9-0.9v-1.7c0-0.5,0.4-0.9,0.9-0.9h16.2c0.5,0,0.9,0.4,0.9,0.9V44
			C120.5,44.4,120.1,44.9,119.6,44.9z"/>
		<path className="logo-fill" d="M126,34.1H93.6c-0.5,0-0.9-0.4-0.9-0.9v-1.7c0-0.5,0.4-0.9,0.9-0.9h32.3c0.5,0,0.9,0.4,0.9,0.9v1.7
			C126.8,33.6,126.5,34.1,126,34.1z"/>
		<g>
			<path className="logo-fill" d="M67.9,28.2c2.2,0,4.4,0.2,6.5,0.7v-4.1c0-5.8,3-9.2,9-9.2h2.2V0.5h-7.2c-15.5,0-21.5,7.9-21.5,22.2v7.4
				C60.4,28.9,64.1,28.2,67.9,28.2z"/>
		</g>
		<path className="logo-fill" d="M132.8,82.6c-1.6-12.7-11.4-23.3-24-25.7c-3.5-0.7-7-0.8-10.4-0.2c-0.1,0-0.1-0.1-0.2-0.1
			c-5.5-11.5-17.3-19.1-30.1-19.1S43.6,44.9,38,56.4c-0.1,0-0.1,0.1-0.2,0.1c-3.6-0.4-7.2-0.2-10.8,0.7c-12.4,3-21.8,13.4-23.5,26
			c-0.2,1.3-0.3,2.6-0.3,3.8c0,3.8,2.6,7.3,6.4,7.8c4.7,0.7,8.8-2.9,8.7-7.5c0-0.7,0-1.5,0.1-2.2c0.8-6.4,5.7-11.8,12.1-13.3
			c2-0.5,4-0.6,5.9-0.3c6.1,0.8,12.1-2.3,14.7-7.7c1.9-4,4.9-7.5,8.9-9.4c4.4-2.1,9.4-2.4,14-0.8c4.8,1.7,8.4,5.3,10.6,9.8
			c2.3,4.4,3.4,7.5,8.3,8.1c2,0.3,7.6,0.2,9.7,0.1c4.1,0,8.2,1.4,11.1,4.3c1.9,2,3.3,4.5,3.9,7.3c0.9,4.5-0.2,9-2.9,12.4
			c-1.9,2.4-4.5,4.2-7.4,5c-1.4,0.4-2.8,0.5-4.2,0.5c-0.8,0-1.9,0-3.2,0c-4,0-12.5,0-18.9,0c-4.4,0-7.9-3.5-7.9-7.9V78.4V63.9
			c0-1.2-1-2.2-2.2-2.2h-3.1c-6.1,0.1-11,6.9-11,14.1s0,26.3,0,26.3c0,7.8,6.3,14.1,14.1,14.1c0,0,34.7-0.1,35.2-0.1
			c8-0.8,15.4-4.9,20.4-11.2C131.5,98.8,133.8,90.8,132.8,82.6z"/>
	</g>
</g>
</svg>
		);
	}
}

// const $ = <K extends keyof HTMLElementTagNameMap>(tagName: K, className?: string, content?: string): HTMLElementTagNameMap[K] => {
// 	const el = document.createElement(tagName);
// 	if (className) {
// 		el.className = className;
// 	}
// 	if (content) {
// 		el.innerText = content;
// 	}

// 	return el;
// };

// const createInput = (id: string, labelName: string, type: string = "text"): HTMLDivElement => {
// 	// <div class="mdc-text-field mdc-text-field--outlined">
// 	// <input type="password" id="password" class="mdc-text-field__input">
// 	// <!-- <label class="mdc-floating-label" for="name">Name</label>
// 	// 		<div class="mdc-line-ripple"></div> -->
// 	// <div class="mdc-notched-outline">
// 	// 	<div class="mdc-notched-outline__leading"></div>
// 	// 	<div class="mdc-notched-outline__notch">
// 	// 		<label for="password" class="mdc-floating-label">Password</label>
// 	// 	</div>
// 	// 	<div class="mdc-notched-outline__trailing"></div>
// 	// </div>

// 	const wrapper = $("div", "mdc-text-field mdc-text-field--outlined");
// 	const input = $("input", "mdc-text-field__input");
// 	input.type = type;
// 	input.id = id;
// 	wrapper.appendChild(input);
// 	const notchedOutline = $("div", "mdc-notched-outline");
// 	notchedOutline.appendChild($("div", "mdc-notched-outline__leading"));
// 	const notch = $("div", "mdc-notched-outline__notch");
// 	const label = $("label", "mdc-floating-label", labelName);
// 	label.setAttribute("for", id);
// 	notch.appendChild(label);
// 	notchedOutline.appendChild(notch);
// 	wrapper.appendChild(notchedOutline);
// 	wrapper.appendChild($("div", "mdc-notched-outline__trailing"));

// 	const field = new MDCTextField(wrapper);

// 	return wrapper;
// };

// export const createCoderLogin = (parentNode: HTMLElement): void => {
// 	parentNode.appendChild($("h1", "header", "Login with Coder"));
// 	parentNode.appendChild(createInput("username", "Username"));
// 	parentNode.appendChild($("br"));
// 	parentNode.appendChild($("br"));
// 	parentNode.appendChild(createInput("password", "Password", "password"));
// };
