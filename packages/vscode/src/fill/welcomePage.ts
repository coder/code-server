/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { escape } from 'vs/base/common/strings';
import { localize } from 'vs/nls';

export function used() {
}

export default () => `
<div class="welcomePageContainer">
	<div class="welcomePage">
		<div class="title">
			<h1 class="caption">${escape(localize('welcomePage.vscode', "Visual Studio Code"))}</h1>
			<p class="subtitle detail">${escape(localize({ key: 'welcomePage.editingEvolved', comment: ['Shown as subtitle on the Welcome page.'] }, "Editing evolved"))}</p>
		</div>
		<div class="row">
			<div class="splash">
				<div class="section start">
					<h2 class="caption">${escape(localize('welcomePage.start', "Start"))}</h2>
					<ul>
						<li><a href="command:workbench.action.files.newUntitledFile">${escape(localize('welcomePage.newFile', "New file"))}</a></li>
						<li class="mac-only"><a href="command:workbench.action.files.openFileFolder">${escape(localize('welcomePage.openFolder', "Open folder..."))}</a></li>
						<li class="windows-only linux-only"><a href="command:workbench.action.files.openFolder">${escape(localize('welcomePage.openFolder', "Open folder..."))}</a></li>
						<li><a href="command:workbench.action.addRootFolder">${escape(localize('welcomePage.addWorkspaceFolder', "Add workspace folder..."))}</a></li>
					</ul>
				</div>
				<div class="section help">
					<h2 class="caption">${escape(localize('welcomePage.help', "Help"))}</h2>
					<ul>
						<li><a href="https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-reference">${escape(localize('welcomePage.keybindingsCheatsheet', "Keyboard cheatsheets"))}</a></li>
						<li><a href="https://code.visualstudio.com/docs/getstarted/introvideos#VSCode">${escape(localize('welcomePage.introductoryVideos', "Introductory videos"))}</a></li>
						<li><a href="https://code.visualstudio.com/docs">${escape(localize('welcomePage.productDocumentation', "Product documentation"))}</a></li>
						<li><a href="https://github.com/codercom/code-server">${escape(localize('welcomePage.gitHubRepository', "GitHub repository"))}</a></li>
					</ul>
				</div>
				<p class="showOnStartup"><input type="checkbox" id="showOnStartup" class="checkbox"> <label class="caption" for="showOnStartup">${escape(localize('welcomePage.showOnStartup', "Show welcome page on startup"))}</label></p>
			</div>
			<div class="commands">
				<div class="section customize">
					<h2 class="caption">${escape(localize('welcomePage.customize', "Customize"))}</h2>
					<div class="list">
						<div class="item showLanguageExtensions"><button role="group" data-href="command:workbench.extensions.action.showLanguageExtensions"><h3 class="caption">${escape(localize('welcomePage.installExtensionPacks', "Tools and languages"))}</h3> <span class="detail">${escape(localize('welcomePage.installExtensionPacksDescription', "Install support for {0} and {1}"))
		.replace('{0}', `<span class="extensionPackList"></span>`)
		.replace('{1}', `<a href="command:workbench.extensions.action.showLanguageExtensions" title="${localize('welcomePage.showLanguageExtensions', "Show more language extensions")}">${escape(localize('welcomePage.moreExtensions', "more"))}</a>`)}
						</span></button></div>
						<div class="item showRecommendedKeymapExtensions"><button role="group" data-href="command:workbench.extensions.action.showRecommendedKeymapExtensions"><h3 class="caption">${escape(localize('welcomePage.installKeymapDescription', "Settings and keybindings"))}</h3> <span class="detail">${escape(localize('welcomePage.installKeymapExtension', "Install the settings and keyboard shortcuts of {0} and {1}"))
		.replace('{0}', `<span class="keymapList"></span>`)
		.replace('{1}', `<a href="command:workbench.extensions.action.showRecommendedKeymapExtensions" title="${localize('welcomePage.showKeymapExtensions', "Show other keymap extensions")}">${escape(localize('welcomePage.others', "others"))}</a>`)}
						</span></button></div>
						<div class="item selectTheme"><button data-href="command:workbench.action.selectTheme"><h3 class="caption">${escape(localize('welcomePage.colorTheme', "Color theme"))}</h3> <span class="detail">${escape(localize('welcomePage.colorThemeDescription', "Make the editor and your code look the way you love"))}</span></button></div>
					</div>
				</div>
				<div class="section learn">
					<h2 class="caption">${escape(localize('welcomePage.learn', "Learn"))}</h2>
					<div class="list">
						<div class="item showCommands"><button data-href="command:workbench.action.showCommands"><h3 class="caption">${escape(localize('welcomePage.showCommands', "Find and run all commands"))}</h3> <span class="detail">${escape(localize('welcomePage.showCommandsDescription', "Rapidly access and search commands from the Command Palette ({0})")).replace('{0}', '<span class="shortcut" data-command="workbench.action.showCommands"></span>')}</span></button></div>
						<div class="item showInterfaceOverview"><button data-href="command:workbench.action.showInterfaceOverview"><h3 class="caption">${escape(localize('welcomePage.interfaceOverview', "Interface overview"))}</h3> <span class="detail">${escape(localize('welcomePage.interfaceOverviewDescription', "Get a visual overlay highlighting the major components of the UI"))}</span></button></div>
						<div class="item showInteractivePlayground"><button data-href="command:workbench.action.showInteractivePlayground"><h3 class="caption">${escape(localize('welcomePage.interactivePlayground', "Interactive playground"))}</h3> <span class="detail">${escape(localize('welcomePage.interactivePlaygroundDescription', "Try essential editor features out in a short walkthrough"))}</span></button></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
`;
