currentLayout = null

function loadStyle(styleFilePath) {
	const path = chrome.extension.getURL(styleFilePath);

	// add new style to head element
	const headElement = document.getElementsByTagName('head')[0];
	headElement.innerHTML += '<link id="customCss" rel="stylesheet" href="' + path + '">';
}

async function createIframe(htmlFilePath, id) {
	const path = chrome.extension.getURL(htmlFilePath);

	// read html file
	const response = await fetch(path);
	const htmlCode = await response.text();

	const element = document.createElement("iframe");
	element.id = id;
	document.body.insertBefore(element, document.body.firstChild);

	iframe = document.getElementById(id);
	iframe.srcdoc = htmlCode;
	return iframe
}

async function loadHtmlToBody(htmlFilePath) {
	const path = chrome.extension.getURL(htmlFilePath);

	// read html file
	const response = await fetch(path);
	const htmlCode = await response.text();

	// add html to body
	const bodyElement = document.getElementsByTagName('body')[0];
	bodyElement.innerHTML = htmlCode + bodyElement.innerHTML;
	return bodyElement
}

function writeToInputBox(inputBoxId, text) {
	const inputBox = document.getElementById(inputBoxId);
	inputBox.value = "";
	inputBox.focus({preventScroll: true});
	document.execCommand('insertText', false, text);
}

class LoadinScreenLayout {
	constructor() {
		this.layoutName = "LoadinScreenLayout";
	}

	load() {
		loadStyle("css/main.css");
		loadStyle("css/background.css");
	}

	unload() {

	}
}

class LoginLayout {
	constructor() {
		this.layoutName = "LoginLayout";
		this.iframe = null;
		this.iframeDocument = null;
	}

	load() {
		this.createLoginIframe()
	}

	async createLoginIframe() {
		this.iframe = await createIframe("html/login.html", "login");

		this.iframe.addEventListener('load', () => {
			this.iframeDocument = this.iframe.contentWindow.document;
			this.iframeDocument.getElementById("play_button").onmousedown = () => {this.playClicked()};
    });
	}

	playClicked() {
		const userName = this.iframeDocument.getElementById("username_input").value;
		const password = this.iframeDocument.getElementById("password_input").value;
		const rememberMe = this.iframeDocument.getElementById("check_box").checked;

		this.tryLogin(userName, password, rememberMe);
	}

	setRememberMeCheckBox(state) {
		const onElement = document.getElementsByClassName("sc-bxivhb bCVAbE");
		const offElement = document.getElementsByClassName("sc-bxivhb knLUAV");

		if(offElement.length == 0 && state == false) {
			onElement[0].click();
			return;
		}
		if (onElement.length == 0 && state == true) {
			offElement[0].click()
			return;
		}

	}

	tryLogin(userName, password, rememberMe) {
		writeToInputBox("username", userName);
		writeToInputBox("password", password);
		this.setRememberMeCheckBox(rememberMe)

		// emulate play button click
		const originalPlayButton = document.getElementsByClassName("sc-bwzfXH jplTTR")[0];
		originalPlayButton.click()
	}

	unload() {
	}
}

function checkForLoginLayout(_currentLayout) {
	if (_currentLayout != null) {
		if (_currentLayout.constructor.name == LoginLayout.name) {
			return;
		}
	}

	const userNameElement = document.getElementById("username");

	if (userNameElement != null) {
		return new LoginLayout();
	}
}

function checkForLoadingLayout(_currentLayout) {
	if (_currentLayout != null) {
		if (_currentLayout.constructor.name == LoadinScreenLayout.name) {
			return null;
		}
	}

	const progressElement = document.getElementById("loading-text");

	if (progressElement != null) {
		return new LoadinScreenLayout();
	}
}

const checkFunctions = [
	checkForLoadingLayout,
	checkForLoginLayout
];

// this function will check that did layout change
function checkLayout() {
	for (const checkFunction of checkFunctions) {
		layout = checkFunction(currentLayout);

		if (layout != null) {

			if (currentLayout != null) {
				currentLayout.unload();
			}

			currentLayout = layout;
			console.log("current layout: " + currentLayout.layoutName)
			layout.load();
		}
	}
}

function disableCss() {
	// style elements with these ids will not be disabled
	cssWhiteList = ["customCss"]

	for (const elementWithStyleAtribute of document.querySelectorAll('[style]')) {
		if (cssWhiteList.includes(elementWithStyleAtribute)) {
			continue;
		}
		elementWithStyleAtribute.removeAttribute("style");
	}

	for ( i=0; i<document.styleSheets.length; i++) {
		const styleId = document.styleSheets.item(i).ownerNode.id;
		if (cssWhiteList.includes(styleId)) {
			continue;
		}
		void(document.styleSheets.item(i).disabled=true);
	}
}

function initLayoutChangeDetector() {
	// check for layout change, everytime when dom is modified
	const mutationCallback = (mutationList, observer) => {
		disableCss(); // TODO: this is kinda laggy so change it to disable css only from new elements
		checkLayout();
	}

	// init MutationObserver
	var mutationObserver = new MutationObserver(mutationCallback);
	const config = {attributes: true, childList: true, subtree: true};
	mutationObserver.observe(document, config);
}

function main() {
	console.log("Tanki flash interface mod is running!");
	initLayoutChangeDetector();
}

main();
