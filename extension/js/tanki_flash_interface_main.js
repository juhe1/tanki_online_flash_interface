currentLayout = null

function loadStyle(styleFilePath) {
	const path = chrome.extension.getURL(styleFilePath);
	
	// add new style to head element
	const headElement = document.getElementsByTagName('head')[0];
	headElement.innerHTML += '<link id="customCss" rel="stylesheet" href="' + path + '">';
}

async function loadHtmlToBody(htmlFilePath) {
	const path = chrome.extension.getURL(htmlFilePath);

	// read html file
	const response = await fetch(path);
	const htmlCode = await response.text();
	console.log(htmlCode);
	
	// add html to body
	const bodyElement = document.getElementsByTagName('body')[0];
	bodyElement.innerHTML = htmlCode + bodyElement.innerHTML;
	return bodyElement
}

class LoadinScreenLayout {
	constructor() {
		this.layoutName = "LoadinScreenLayout";
	}
	
	load() {
		loadStyle("css/background.css");
	}
	
	unload() {
		
	}
}

class LoginLayout {
	constructor() {
		this.layoutName = "LoginLayout";
	}
	
	load() {
		loadStyle("css/login/bottom_bar.css");
		loadStyle("css/login/check_mark.css");
		loadStyle("css/login/login.css");
		loadStyle("css/login/play_button.css");
		
		var newElement = loadHtmlToBody("html/login.html");
		newElement.getElementById("login_header").src = chrome.extension.getURL("images/tank_window/login_header.png");
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
