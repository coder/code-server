import { logger } from "@coder/logger";
import "./index.scss";

logger.info("Starting app");

const overlay = document.getElementById("overlay");
const logo = document.getElementById("logo");
if (overlay && logo) {
	overlay.addEventListener("mousemove", (event) => {
		const xPos = ((event.clientX - logo.offsetLeft) / 24).toFixed(2);
		const yPos = ((logo.offsetTop - event.clientY) / 24).toFixed(2);

		logo.style.transform = `perspective(200px) rotateX(${yPos}deg) rotateY(${xPos}deg)`;
	});
}

import "@coder/vscode";
