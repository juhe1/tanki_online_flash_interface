function loadStyle(styleFilePath) {
	const path = chrome.extension.getURL(styleFilePath);

	// add new style to head element
	const headElement = document.getElementsByTagName('head')[0];
	headElement.innerHTML += '<link id="customCss" rel="stylesheet" data-tfim_allow_style="" href="' + path + '">';
}

function addBodyToDocument(body) {
	var newElement = document.createElement('div');
	newElement.innerHTML = body.innerHTML;

	var firstChild = document.body.firstChild;
	document.body.insertBefore(newElement, firstChild);
}

function addHeadToDocument(head) {
	const elements = head.querySelectorAll('*');

	for (const element of elements) {

		// add tfim_allow_style atribute to element if the element is css link thing, becuase that will prevent css disable code for disabling the css
		if (element.rel == "stylesheet") {
			element.dataset.tfim_allow_style = "";
		}

		document.head.appendChild(element);
	}
}

async function loadHtml(htmlFilePath) {
	const path = chrome.extension.getURL(htmlFilePath);

	// read html file
	const response = await fetch(path);
	const htmlCode = await response.text();

	// create new document from htmlCode
	const parser = new DOMParser();
	const newDocument = parser.parseFromString(htmlCode, 'text/html');

	addHeadToDocument(newDocument.head)
	addBodyToDocument(newDocument.body)
}

function writeToInputBox(inputBoxId, text) {
	const inputBox = document.getElementById(inputBoxId);
	inputBox.value = "";
	inputBox.focus({preventScroll: true});
	document.execCommand('insertText', false, text);
}

// this function will call the callback function when element that is using className is found
function waitForElementByClass(className, callback) {
	var stop = false;
	var observer = new MutationObserver(function(mutationsList) {
		mutationsList.forEach(function(mutation) {
			if (stop) {return;}
			if (mutation.type === 'childList') {
				var elements = document.getElementsByClassName(className);
				for (var i = 0; i < elements.length; i++) {
					// Check if the element matches the desired class name
					if (elements[i].classList.value == className) {
						stop = true;
						observer.disconnect(); // Stop observing once the element is found
						callback(elements[i]); // Call the callback function with the element
						return; // Exit the loop
					}
				}
			}
		});
	});

	observer.observe(document.body, { childList: true, subtree: true });
}

class StartScreenLayout {
	static layoutName = "StartScreenLayout";

	constructor() {
	}

	static isOriginalLayoutLoaded() {
		const clickAnyButtonToStartElement = document.getElementsByClassName("ksc-0 StartScreenComponentStyle-text");

		if (clickAnyButtonToStartElement.length != 0) {
			return true;
		}
	}

	clickStartButton() {
		const startButton = document.getElementsByClassName("ksc-0 StartScreenComponentStyle-text")[0];
		startButton.click();
	}

	async load() {
		loadStyle("css/main.css");

		// the idea of this is to push all original elements out of the window
		await loadHtml("html/push_original_elements_out.html");

		this.clickStartButton();
	}

	unload() {
	}
}

const imageCount = 36;
const imageChangeDelay = 5000;
const gooMaxLength = 589;
const speedMultiplierIncrease = 0.01;
const stopIncrease = 10;

class LoadingScreenLayout {
	static layoutName = "LoadingScreenLayout";

	constructor() {
		this.speedMultiplier = 5;
	}

	// we have 2 different detecting methods, because tanki online has 2 kind of loading screens
	static isOriginalLayoutLoaded() {
		const progressElement = document.getElementById("loading-text");

		if (progressElement != null) {
			return true;
		}

		const nextHintElements = document.getElementsByClassName("sc-bxivhb kBriwm");

		if (nextHintElements.length != 0) {
			return true;
		}
	}

	async load() {
		await loadHtml("html/loading.html");

		this.changeImage();
		this.initGooAnimation();
	}

	changeImage() {
		const imageElement = document.getElementById("tip_image");

		if (imageElement == null) {return}

		const randomImage = Math.floor(Math.random() * 36) + 1;
		imageElement.src = chrome.extension.getURL(`images/loading/tip_images/tip (${randomImage}).tnk`);

		setTimeout(this.changeImage, imageChangeDelay);

	}

	initGooAnimation() {
		const element = document.getElementById("goo");
		var elementStyle = element.style;

		// Set the width of the div element to 0 initially
		elementStyle.width = "0px";

		var intervalFunc = () => {
			// Increase the width of the div element
			elementStyle.width = `${parseFloat(elementStyle.width) + 5 / this.speedMultiplier}px`;

			// add speed
			if (this.speedMultiplier < stopIncrease) {
				this.speedMultiplier += speedMultiplierIncrease;
			}

			if (parseFloat(elementStyle.width) <= gooMaxLength) {
				setTimeout(intervalFunc, 8 * this.speedMultiplier);
			}
		}

		intervalFunc();
	}

	finishGooAnimation() {
		this.speedMultiplier = 0.2;
	}


	unload() {
		this.finishGooAnimation();

		setTimeout(() => {
			const element = document.getElementById("loading_main_div");
			element.remove();
		}, 400);
	}
}


class LoginLayout {
	static layoutName = "LoginLayout";

	constructor() {
	}

	static isOriginalLayoutLoaded() {
		const entranceTitleElement = document.getElementsByClassName("ksc-0 MainEntranceComponentStyle-title");

		if (entranceTitleElement.length != 0) {
			return true;
		}
	}

	async load() {
		await loadHtml("html/login.html");

		document.getElementById("play_button").onclick = () => {this.playClicked()};
	}

	playClicked() {
		waitForElementByClass("ksc-21 Common-flexCenterAlignCenter", () => {this.onAuthorizationButtonCreated()});

		const gameAccountButtonElement = document.getElementsByClassName("ksc-0 RoundBigButtonComponentStyle-commonContainer")[0];
		gameAccountButtonElement.click();
	}

	setRememberMeCheckBox(state) {
		const checkBoxElement = document.getElementsByClassName("ksc-12 CheckBoxStyle-checkbox")[0];

		if (!state) {
			checkBoxElement.click();
		}
	}

	onAuthorizationButtonCreated() {
		waitForElementByClass("ksc-33 EntranceComponentStyle-helpLink", () => {this.onLoginFormCreated()});
		var authorizationButtonElement = document.getElementsByClassName("ksc-0 RoundBigButtonComponentStyle-commonContainer")[1];
		authorizationButtonElement.click();
	}

	onLoginFormCreated() {
		const userName = document.getElementById("username_input").value;
		const password = document.getElementById("password_input").value;
		const rememberMe = document.getElementById("check_box").checked;

		writeToInputBox("username", userName);
		writeToInputBox("password", password);
		this.setRememberMeCheckBox(rememberMe);

		const originalPlayButton = document.getElementsByClassName("ksc-34 Common-flexCenterAlignCenter EntranceComponentStyle-buttonActive EntranceComponentStyle-styleButtons Font-normal Common-flexCenterAlignCenter Common-displayFlex Common-alignCenter")[0];
		originalPlayButton.click();
	}

	unload() {
		document.getElementById("login_main_div").remove();
	}
}


class MainMenuLayout {
	static layoutName = "MainMenuLayout";

	constructor() {
	}

	static isOriginalLayoutLoaded() {
		const logoElements = document.getElementsByClassName("ksc-0 UserInfoContainerStyle-blockForIconTankiOnline");

		if (logoElements.length != 0) {
			return true;
		}
	}

	async load() {

	}

	unload() {
	}
}

const layoutClasses = [
	StartScreenLayout,
	LoadingScreenLayout,
	LoginLayout,
	MainMenuLayout
];

currentLayout = null

// note that with layouts i mean for example garage, login, loading screen
// this function will check that did layout change
function checkLayout() {
	for (const layoutClass of layoutClasses) {

		// continue if layout is already loaded
		if (currentLayout != null && currentLayout.constructor.layoutName == layoutClass.layoutName) {
			continue;
		}

		// unload old layout and load new layout if tanki online changed active layout
		if (layoutClass.isOriginalLayoutLoaded()) {

			if (currentLayout != null) {
				currentLayout.unload();
			}

			currentLayout = new layoutClass();
			currentLayout.load();
			console.log("current layout: " + currentLayout.constructor.layoutName)
		}
	}
}

function disableCss() {
	for (const elementWithStyleAtribute of document.querySelectorAll('[style]')) {
		if (elementWithStyleAtribute.hasAttribute("data-tfim_allow_style")) {
			continue;
		}
		elementWithStyleAtribute.removeAttribute("style");
	}

	for ( i=0; i<document.styleSheets.length; i++) {
		const element = document.styleSheets.item(i).ownerNode;
		if (element.hasAttribute("data-tfim_allow_style")) {
			continue;
		}
		void(document.styleSheets.item(i).disabled=true);
	}
}

function initScrollLock() {
	addEventListener("scroll", (event) => {
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	});
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
	//initScrollLock();
}

main();
