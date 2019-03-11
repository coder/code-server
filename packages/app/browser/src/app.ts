//@ts-ignore
import { MDCTextField } from "@material/textfield";
//@ts-ignore
import { MDCCheckbox } from "@material/checkbox";
import "material-components-web/dist/material-components-web.css";
import "./app.scss";

document.querySelectorAll(".mdc-text-field").forEach((d) => new MDCTextField(d));
document.querySelectorAll(".mdc-checkbox").forEach((d) => new MDCCheckbox(d));

window.addEventListener("message", (event) => {
	if (event.data === "app") {
		document.body.classList.add("in-app");

		const back = document.querySelector(".back")!;
		back.addEventListener("click", () => {
			(event.source as Window).postMessage("back", event.origin);
		});
	}
});

const password = document.getElementById("password") as HTMLInputElement;
const submit = document.getElementById("submit") as HTMLButtonElement;
if (!submit) {
	throw new Error("No submit button found");
}
submit.addEventListener("click", () => {
	document.cookie = `password=${password.value}`;
	location.reload();
});

/**
 * Notify user on load of page if previous password was unsuccessful
 */
const reg = new RegExp(`password=(\\w+);?`);
const matches = document.cookie.match(reg);
const errorDisplay = document.getElementById("error-display") as HTMLDivElement;

if (document.referrer === document.location.href && matches) {
	errorDisplay.innerText = "Password is incorrect!";
}