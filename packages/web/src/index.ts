import { logger, field, time } from "@coder/logger";
import { load } from "@coder/vscode";
import "./index.scss";

const loadTime = time(2500);
logger.info("Loading IDE");

const overlay = document.getElementById("overlay");
const logo = document.getElementById("logo");
const msgElement = overlay
	? overlay.querySelector(".message") as HTMLElement
	: undefined;

if (overlay && logo) {
	overlay.addEventListener("mousemove", (event) => {
		const xPos = ((event.clientX - logo.offsetLeft) / 24).toFixed(2);
		const yPos = ((logo.offsetTop - event.clientY) / 24).toFixed(2);

		logo.style.transform = `perspective(200px) rotateX(${yPos}deg) rotateY(${xPos}deg)`;
	});
}

load().then(() => {
	if (overlay) {
		overlay.style.opacity = "0";
		overlay.addEventListener("transitionend", () => {
			overlay.remove();
		});
	}
}).catch((error: Error) => {
	logger.error(error.message);
	if (overlay) {
		overlay.classList.add("error");
	}
	if (msgElement) {
		const button = document.createElement("div");
		button.className = "reload-button";
		button.innerText = "Reload";
		button.addEventListener("click", () => {
			location.reload();
		});
		msgElement.innerText = `Failed to load: ${error.message}.`;
		msgElement.parentElement!.appendChild(button);
	}
}).finally(() => {
	logger.info("Load completed", field("duration", loadTime));
});
