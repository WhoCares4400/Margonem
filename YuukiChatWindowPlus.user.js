// ==UserScript==
// @name         Chat Window+ (ChatW+) [NI]
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Odświeżone okno chatu
// @author       Paladynka Yuuki
// @match        http*://*.margonem.pl/
// @match        http*://*.margonem.com/
// @exclude      http*://margonem.*/*
// @exclude      http*://www.margonem.*/*
// @exclude      http*://new.margonem.*/*
// @exclude      http*://forum.margonem.*/*
// @exclude      http*://commons.margonem.*/*
// @exclude      http*://dev-commons.margonem.*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=margonem.pl
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const normalWindowHeight = 297;
    const fadeOutWindowHeight = 309;
    const chatInputWrapperHeight = 57;

    const excludedClickClases = ["chat-channel-card", "chat-channel-card-icon", "magic-input", "card-name", "card-remove", "card-list", "link", "chat-config-wrapper", "chat-config-wrapper-button", "increase-opacity", "toggle-height-button", "toggle-width-btn", "toggle-fade-out-button", "chat-hover-hide-checkbox", "click-able"];

    var fadeOutTop = Boolean(parseInt(GM_getValue('yk-chatFadeOutTop', '1'), 10));
    var hoverHide = Boolean(parseInt(GM_getValue('yk-chatHoverHide', '0'), 10));
    var windowHeight = fadeOutTop ? fadeOutWindowHeight : normalWindowHeight;
    var borderImageHeight = 0;

    var chatHeight;
    var chatWidth;

    var enabled = Boolean(parseInt(GM_getValue('yk-chatEnabled', '1'), 10));
    var inBattle = false;

    var enterPressed = false;
    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 13 && enabled) {
            if (enterPressed) {
                return;
            }
            enterPressed = true;
        }
    });
    document.addEventListener('keyup', function(e) {
        enterPressed = false;
    });

    const STYLE_CONTENT = `
        .chat-size-0 .left-column.main-column {
            display: block !important;
        }
        .chat-size-0 .left-column.main-column > .border {
            display: none;
        }
        .chat-size-0 .yk-chat-plus {
            height: ${normalWindowHeight}px;
            width: 550px;
            top: auto;
            left: -2px;
            bottom: 0 !important;
            pointer-events: none;
        }
        .chat-size-0 .yk-chat-plus > * {
            pointer-events: auto;
        }
        .chat-size-0 .yk-chat-plus.fade-out-top {
            height: ${fadeOutWindowHeight}px;
        }
        .chat-size-0 .yk-chat-plus .chat-input-wrapper {
            width: 100%;
        }
        .chat-size-0 .yk-chat-plus .chat-input-wrapper > * {
            margin: 0 1rem 0 2rem;
        }
        .chat-size-0 .yk-chat-plus .magic-input-wrapper {
            margin-bottom: 0.5rem;
        }
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .magic-input-placeholder {
            color: #c9c9c9 !important;
            height: 1rem;
            overflow: hidden;
        }
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .magic-input {
            box-shadow: inset 0 0 3px 3px rgba(0, 0, 0, 0.3) !important;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper.chat-message-wrapper.scrollable {
            position: relative !important;
        }
        .chat-size-0 .yk-chat-plus .chat-channel-card-wrapper {
            position: absolute;
            display: flex;
            flex-direction: column;
        }
        .chat-size-0 .yk-chat-plus .chat-channel-card-wrapper .chat-channel-card {
            background: rgba(0, 0, 0, 0.32);
            border-radius: 2px;
        }
        .chat-size-0 .yk-chat-plus.border-window.transparent .scroll-wrapper {
            flex-grow: 0;
            margin: auto 0 0 33px;
        }
        .chat-size-0 .yk-chat-plus .new-chat-message.expired-message {
            opacity: 0.75;
        }
        .chat-size-0 .yk-chat-plus .chat-info-wrapper {
            right: -10px;
        }
        .chat-size-0 .yk-chat-plus .chat-config-wrapper {
            right: 77px;
        }
        .chat-size-0 .yk-chat-plus .chat-config-wrapper,
        .chat-size-0 .yk-chat-plus .chat-config-wrapper > * {
            width: 20px !important;
        }
        .chat-size-0 .yk-chat-plus .border-image {
            margin-top: auto !important;
        }

        /* fade-out top styles */
        .chat-size-0 .yk-chat-plus.fade-out-top .scroll-wrapper,
        .chat-size-0 .yk-chat-plus.fade-out-top .border-image {
            mask-image: linear-gradient(to bottom, transparent, black 26px, #000);
            -webkit-mask-image: linear-gradient(to bottom, transparent, black 26px, #000);
        }
        .chat-size-0 .yk-chat-plus.fade-out-top .border-image {
            mask-image: linear-gradient(to bottom, transparent, black 28px, #000);
            -webkit-mask-image: linear-gradient(to bottom, transparent, black 28px, #000);
        }
        .chat-size-0 .yk-chat-plus.fade-out-top .chat-channel-card-wrapper {
            margin-top: 0.75rem;
        }
        .chat-size-0 .yk-chat-plus.fade-out-top .scrollbar-wrapper {
            margin-top: 1.25rem !important;
        }
        .chat-size-0 .yk-chat-plus.fade-out-top .scroll-wrapper .scrollbar-wrapper {
            height: calc(100% - 1.25rem);
        }
        .chat-size-0 .yk-chat-plus.fade-out-top .border-image {
            height: calc(100% - 0.375rem);
        }

        /* hover hide styles */
        .chat-size-0 .yk-chat-plus.hover-hide .scroll-wrapper {
            opacity: 1;
            -webkit-transition: opacity 0.1s ease;
            -moz-transition: opacity 0.1s ease;
            -ms-transition: opacity 0.1s ease;
            -o-transition: opacity 0.1s ease;
            transition: opacity 0.1s ease;
        }
        .chat-size-0 .yk-chat-plus.hover-hide:not(:has(magic_input:focus)) .scroll-wrapper.hover-hidden:not(.supress) {
            opacity: 0;
            pointer-events: none;
        }
        .chat-size-0 .yk-chat-plus.hover-hide:not(:has(magic_input:focus)) .scroll-wrapper.hover-hidden.supress {
            pointer-events: auto;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .chat-hover-dummy {
            display: none;
        }
         .chat-size-0 .yk-chat-plus.hover-hide .scroll-wrapper.hover-hidden:not(:has(magic_input:focus)) .chat-hover-dummy {
            display: block;
        }
        .chat-size-0 .yk-chat-plus.hover-hide .border-image {
           transition: height 0.07s ease;
        }

        /* scroll styles */
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper {
            height: 100%;
            width: 0.375rem;
            right: 0;
            margin-left: 33px;
        }
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="0"] .scrollbar-wrapper {
            opacity: 0.25;
        }
        .chat-size-0 .yk-chat-plus:not(:hover) .scrollbar-wrapper:not(:active) {
            visibility: hidden;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper.scrollable .scroll-pane {
            padding-right: 0.5rem;
            line-height: 0.8rem;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-up,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-down,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track .handle {
            width: 100% !important;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track .handle {
            height: 1.125rem;
            background: wheat !important;
            border-radius: 4px !important;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-up,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-down {
            height: 0.625rem;
            background: none;
            color: wheat !important;
            font-weight: bold;
            font-size: 0.8rem;
            left: 0;
            margin-left: -0.125rem;
            transform: rotate(-90deg);
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-up::before {
            content: ">";
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-down::before {
            content: "<";
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track {
            top: 8px;
            left: 1px;
            bottom: 9px;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .background {
            left: -1px;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track .handle {
            background: none;
            border: none;
        }

        /* checkbox */
        .yk-checkbox {
            --yk-checkbox-size: 1.2em;
            --yk-checkbox-border-color: rgba(194, 194, 194, 0.4);
            --yk-checkbox-bg: rgb(43 43 43 / 15%);
            --yk-checkbox-checked-bg: rgb(12 12 12 / 30%);
            --yk-checkbox-check-color: #00bc18;
            --yk-checkbox-transition: 0.2s ease;
            --yk-checkbox-focus-ring: rgba(255, 255, 255, 0.5);

            display: inline-flex;
            align-items: center;
            user-select: none;
            font-family: sans-serif;
            font-size: 14px;
            z-index: 1;
        }
        .yk-checkbox input[type="checkbox"] {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            position: relative;
            width: var(--yk-checkbox-size);
            height: var(--yk-checkbox-size);
            margin: 0;
            border-radius: 4px;
            border: 1px solid var(--yk-checkbox-border-color);
            background: var(--yk-checkbox-bg);
            outline: none;
            cursor: url(../img/gui/cursor/5n.png?v=1732624602172) 4 0, url(../img/gui/cursor/5n.cur?v=1732624602172) 4 0, auto !important;
            transition:
                background-color var(--yk-checkbox-transition),
                border-color var(--yk-checkbox-transition),
                box-shadow var(--yk-checkbox-transition);
        }
        .yk-checkbox input[type="checkbox"]:hover {
            border-color: rgba(255, 255, 255, 0.6);
        }
        .yk-checkbox input[type="checkbox"]:focus {
            box-shadow: 0 0 0 2px var(--yk-checkbox-focus-ring);
        }
        .yk-checkbox input[type="checkbox"]:checked {
            background: var(--yk-checkbox-checked-bg);
            border-color: rgba(194, 194, 194, 0.6);
        }
        .yk-checkbox input[type="checkbox"]:checked::after {
            content: "";
            position: absolute;
            left: 0.38em;
            width: 0.25em;
            height: 0.65em;
            border-right: 2px solid var(--yk-checkbox-check-color);
            border-bottom: 2px solid var(--yk-checkbox-check-color);
            transform: rotate(45deg);
        }
        .yk-checkbox label {
            color: #fff;
            opacity: 0.85;
            transition: opacity var(--yk-checkbox-transition);
        }
        .yk-checkbox:hover label {
            opacity: 1;
        }

        /* background opacity levels */
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="0"]:hover:not(:has(.increase-opacity:hover, .scroll-wrapper.hover-hidden:hover:not(.supress))) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="0"]:has(.magic-input:active) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="0"]:has(.magic-input:focus) .border-image {
            opacity: 0.6 !important;
        }
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="1"]:hover:not(:has(.increase-opacity:hover, .scroll-wrapper.hover-hidden:hover:not(.supress))) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="1"]:has(.magic-input:active) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="1"]:has(.magic-input:focus) .border-image {
            opacity: 0.8 !important;
        }
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="2"]:hover:not(:has(.increase-opacity:hover, .scroll-wrapper.hover-hidden:hover:not(.supress))) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="2"]:has(.magic-input:active) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="2"]:has(.magic-input:focus) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="3"]:hover:not(:has(.increase-opacity:hover, .scroll-wrapper.hover-hidden:hover:not(.supress))) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="3"]:has(.magic-input:active) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="3"]:has(.magic-input:focus) .border-image {
            opacity: 1 !important;
        }

        /* reset styles */
        .chat-size-0 .yk-chat-plus,
        .chat-size-0 .yk-chat-plus .chat-message-wrapper,
        .chat-size-0 .yk-chat-plus .chat-channel-card-wrapper,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .magic-input-wrapper,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .magic-input-wrapper .magic-input,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .control-wrapper .menu-card,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .control-wrapper .chat-config-wrapper {
            background: none;
            border: none;
            box-shadow: none;
        }
        .chat-size-1 .new-chat-window:not(.yk-chat-plus) .border-image,
        .chat-size-1 .new-chat-window:not(.yk-chat-plus) .chat-input-wrapper .control-wrapper .increase-opacity,
        .chat-size-1 .new-chat-window:not(.yk-chat-plus) .chat-input-wrapper .control-wrapper .toggle-height-button,
        .chat-size-1 .new-chat-window:not(.yk-chat-plus) .chat-input-wrapper .control-wrapper .toggle-width-btn,
        .chat-size-1 .new-chat-window:not(.yk-chat-plus) .chat-input-wrapper .control-wrapper .toggle-fade-out-button,
        .chat-size-1 .new-chat-window:not(.yk-chat-plus) .chat-input-wrapper .control-wrapper .chat-hover-hide {
            display: none;
        }
    `;


    const intercept = (obj, key, cb, _ = obj[key]) => obj[key] = (...args) => {
        const result = _.apply(obj, args);
        return cb(...args) ?? result;
    };

    /**
     * Waits for the chat window to be ready and initializes it.
     */
    function waitForChatWindow() {
        const interval = setInterval(() => {
            if (typeof Engine !== 'undefined' && Engine?.chatController?.getChatWindow()?.get$chatWindow) {
                clearInterval(interval);
                GM_addStyle(STYLE_CONTENT);
                initializeChatWindow();
            }
        }, 100);
    }

    /**
     * Initializes the chat window modifications.
     */
    function initializeChatWindow() {
        const wnd = Engine?.chatController?.getChatWindow()?.get$chatWindow()[0];
        if (!wnd) return;

        customizeWindowAppearance(wnd);
        customizeChatHeight(wnd);
        customizeChatWidth(wnd);
        toggleFadeOutTop(wnd);
        hoverHideCheckbox(wnd);

        hangleChatClick(wnd);
        handleMessageInputAlignment(wnd);
        handleBattle(wnd);

        const interval = setInterval(() => {
            let gameWindowPositioner = document.querySelector('.game-window-positioner');
            if (!gameWindowPositioner) {
                return;
            }

            const hasChatSizeClass = Array.from(gameWindowPositioner.classList).some(className => className.startsWith('chat-size-'));
            if (Engine?.allInit && hasChatSizeClass) {
                clearInterval(interval);

                setTimeout(()=>{
                    if (document.querySelector('.game-window-positioner').classList.contains('chat-size-'+(enabled ? '1' : '0'))) {
                        Engine.chatController.getChatWindow().chatToggle();
                    }
                    chatToggle(wnd);
                    handleChatToggle(wnd);

                    setTimeout(() => {
                        handleOtherChatAddons();
                    }, 1500);
                }, 1);
            }
        }, 100);
    }

    /**
     * Customizes the appearance of the chat window.
     * @param {HTMLElement} wnd - The chat window element.
     */
    function customizeWindowAppearance(wnd) {
        // Chat transparency
        const borderImageDiv = document.createElement("div");
        borderImageDiv.classList.add("border-image");
        borderImageDiv.style.margin = '0';
        borderImageDiv.style.border = 'unset';
        borderImageDiv.style.boxShadow = 'unset';
        wnd.appendChild(borderImageDiv);

        const opacityLevel = parseInt(GM_getValue('yk-chatOpacityLvl', '1'), 10);
        wnd.setAttribute('data-opacity-lvl', opacityLevel.toString());

        // Create opacity control button
        const increaseOpacityBtn = document.createElement('div');
        increaseOpacityBtn.className = 'increase-opacity';
        Object.assign(increaseOpacityBtn.style, {
            top: '6px',
            left: 'auto',
            right: '6px',
            position: 'absolute',
        });
        increaseOpacityBtn.addEventListener('click', () => {
            let opacity = parseInt(wnd.getAttribute('data-opacity-lvl'), 10);
            opacity = isNaN(opacity) ? 0 : opacity;
            const newOpacity = (opacity + 1) % 6;
            wnd.setAttribute('data-opacity-lvl', newOpacity.toString());
            GM_setValue('yk-chatOpacityLvl', newOpacity.toString());
        });
        $(increaseOpacityBtn).tip("Zmień przezroczystość okienka");
        wnd.querySelector('.chat-input-wrapper .control-wrapper').appendChild(increaseOpacityBtn);
    }

    /**
     * Adds functionality to change height of the chat window.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function customizeChatHeight(wnd) {
        const HEIGHT_INCREMENT = 10; //%
        const MAX_HEIGHT = 100; //%
        const MIN_HEIGHT = 10; //%
        const DEFAULT_HEIGHT = 100; //%

        const chatMessageWrapper = wnd.querySelector('.chat-message-wrapper');
        if (!chatMessageWrapper) return;
        const borderImage = wnd.querySelector('.border-image');

        let maxChatHeight = windowHeight - chatInputWrapperHeight;

        const storedHeightPercent = parseInt(GM_getValue('yk-chatHeight', DEFAULT_HEIGHT.toString()), 10);
        const initialHeightPercent = isNaN(storedHeightPercent) ? DEFAULT_HEIGHT : storedHeightPercent;
        const initialHeight = (maxChatHeight * (initialHeightPercent/100));
        chatMessageWrapper.style.height = `${initialHeight}px`;
        borderImageHeight = initialHeightPercent === 100 ? 0 : (initialHeight + chatInputWrapperHeight);
        borderImage.style.height = 0 >= borderImageHeight ? '' : `${borderImageHeight}px`;
        chatHeight = initialHeight;

        const toggleHeightBtn = document.createElement('div');
        toggleHeightBtn.className = 'toggle-height-button';
        Object.assign(toggleHeightBtn.style, {
            top: '0',
            right: '18px',
            margin: '5px',
            position: 'absolute',
            cursor: 'url(../img/gui/cursor/5n.png?v=1732624602172) 4 0, url(../img/gui/cursor/5n.cur?v=1732624602172) 4 0, auto',
        });
        toggleHeightBtn.innerHTML = `
<svg width="15px" height="15px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
  <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
  <g id="SVGRepo_iconCarrier">
    <path d="M12 22V2M12 22L8 18M12 22L16 18M12 2L8 6M12 2L16 6" stroke="#dbdbdb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
</svg>
`;
        toggleHeightBtn.addEventListener('click', () => {
            let currentHeightPercent = Math.round((parseInt(chatMessageWrapper.style.height, 10)/maxChatHeight)*100) || DEFAULT_HEIGHT;
            currentHeightPercent = currentHeightPercent >= MAX_HEIGHT ? MIN_HEIGHT : currentHeightPercent + HEIGHT_INCREMENT;
            let currentHeight = (maxChatHeight * (currentHeightPercent/100));
            chatMessageWrapper.style.height = `${currentHeight}px`;
            borderImageHeight = currentHeightPercent === 100 ? 0 : (currentHeight + chatInputWrapperHeight);
            borderImage.style.height = 0 >= borderImageHeight ? '' : `${borderImageHeight}px`;
            chatHeight = currentHeight;
            setTimeout(()=>{alignMessageInput(wnd);},100);

            message(`Wysokość chatu: ${currentHeightPercent}%`);
            GM_setValue('yk-chatHeight', currentHeightPercent.toString());
        });
        $(toggleHeightBtn).tip("Zmień wysokość chatu");
        wnd.querySelector('.chat-input-wrapper .control-wrapper').appendChild(toggleHeightBtn);
    }

    /**
     * Adds functionality to change width of the chat window.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function customizeChatWidth(wnd) {
        const WIDTH_INCREMENT = 50; //px
        const MAX_WIDTH = 700; //px
        const MIN_WIDTH = 300; //px
        const DEFAULT_WIDTH = 550; //px

        if (enabled) {
            const storedWidth = parseInt(GM_getValue('yk-chatWidth', DEFAULT_WIDTH.toString()), 10);
            const initialWidth = isNaN(storedWidth) ? DEFAULT_WIDTH : storedWidth;
            wnd.style.width = `${initialWidth}px`;
            chatWidth = initialWidth;
        }

        const resizeObserver = new ResizeObserver(() => {
            if (!enabled) {
                return;
            }
            let storedWidth = parseInt(GM_getValue('yk-chatWidth', DEFAULT_WIDTH.toString()), 10);
            let initialWidth = isNaN(storedWidth) ? DEFAULT_WIDTH : storedWidth;
            wnd.style.width = `${initialWidth}px`;
            chatWidth = initialWidth;
        });
        resizeObserver.observe(wnd);

        const toggleWidthBtn = document.createElement('div');
        toggleWidthBtn.className = 'toggle-width-btn';
        Object.assign(toggleWidthBtn.style, {
            top: '0',
            right: '34px',
            margin: '5px',
            position: 'absolute',
            cursor: 'url(../img/gui/cursor/5n.png?v=1732624602172) 4 0, url(../img/gui/cursor/5n.cur?v=1732624602172) 4 0, auto',
        });
        toggleWidthBtn.innerHTML = `
<svg width="15px" height="15px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#dbdbdb">
  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
  <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
  <g id="SVGRepo_iconCarrier">
    <path d="M22 12H2M22 12L18 16M22 12L18 8M2 12L6 16M2 12L6 8" stroke="#dbdbdb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
</svg>
`;
        toggleWidthBtn.addEventListener('click', () => {
            let currentWidth = parseInt(wnd.style.width, 10) || DEFAULT_WIDTH;
            currentWidth = currentWidth >= MAX_WIDTH ? MIN_WIDTH : currentWidth + WIDTH_INCREMENT;
            wnd.style.width = `${currentWidth}px`;
            chatWidth = currentWidth;
            setTimeout(()=>{alignMessageInput(wnd);},100);

            message(`Szerokość chatu: ${currentWidth}px`);
            GM_setValue('yk-chatWidth', currentWidth.toString());
        });
        $(toggleWidthBtn).tip("Zmień szerokość chatu");
        wnd.querySelector('.chat-input-wrapper .control-wrapper').appendChild(toggleWidthBtn);
    }

    /**
     * Adds functionality to toggle fading out of window top edge.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function toggleFadeOutTop(wnd) {
        const toggleFadeOutBtn = document.createElement('div');
        toggleFadeOutBtn.className = 'toggle-fade-out-button';
        Object.assign(toggleFadeOutBtn.style, {
            top: '0',
            right: '53px',
            margin: '2px',
            position: 'absolute',
            cursor: 'url(../img/gui/cursor/5n.png?v=1732624602172) 4 0, url(../img/gui/cursor/5n.cur?v=1732624602172) 4 0, auto',
        });
        toggleFadeOutBtn.innerHTML = `
<svg width="21px" height="21px" viewBox="0 0 76 76" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" baseProfile="full" enable-background="new 0 0 76.00 76.00" xml:space="preserve" fill="#dbdbdb">
  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
  <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
  <g id="SVGRepo_iconCarrier">
    <linearGradient id="SVGID_Fill1_" gradientUnits="objectBoundingBox" x1="0.853553" y1="0.853553" x2="1.85355" y2="0.853553" gradientTransform="rotate(225.000000 0.853553 0.853553)">
      <stop offset="0" stop-color="#dbdbdb" stop-opacity="0"></stop>
      <stop offset="1" stop-color="#dbdbdb" stop-opacity="1"></stop>
    </linearGradient>
    <path fill="url(#SVGID_Fill1_)" stroke-width="0.2" stroke-linejoin="round" d="M 19,19L 25.3333,19L 25.3333,25.3333L 31.6667,25.3333L 31.6667,19L 38,19L 38,25.3333L 44.3333,25.3333L 44.3333,19L 50.6667,19L 50.6667,25.3333L 57,25.3333L 57,31.6667L 50.6667,31.6667L 50.6667,38L 57,38L 57,44.3333L 50.6667,44.3333L 50.6667,50.6667L 57,50.6667L 57,57L 50.6667,57L 50.6667,50.6667L 44.3333,50.6667L 44.3333,57L 38,57L 38,50.6667L 31.6667,50.6667L 31.6667,57L 25.3333,57L 25.3333,50.6667L 19,50.6667L 19,44.3333L 25.3333,44.3333L 25.3333,38L 19,38L 19,31.6667L 25.3333,31.6667L 25.3333,25.3333L 19,25.3333L 19,19 Z M 50.6667,38L 44.3333,38L 44.3333,44.3333L 50.6667,44.3333L 50.6667,38 Z M 50.6667,25.3333L 44.3333,25.3333L 44.3333,31.6667L 50.6667,31.6667L 50.6667,25.3333 Z M 44.3333,44.3333L 38,44.3333L 38,50.6667L 44.3333,50.6667L 44.3333,44.3333 Z M 38,44.3333L 38,38L 31.6667,38L 31.6667,44.3333L 38,44.3333 Z M 31.6667,44.3333L 25.3333,44.3333L 25.3333,50.6667L 31.6667,50.6667L 31.6667,44.3333 Z M 44.3333,31.6667L 38,31.6667L 38,38L 44.3333,38L 44.3333,31.6667 Z M 38,31.6667L 38,25.3333L 31.6667,25.3333L 31.6666,31.6667L 38,31.6667 Z M 31.6666,31.6667L 25.3333,31.6667L 25.3333,38L 31.6667,38L 31.6666,31.6667 Z "></path>
  </g>
</svg>
        `;
        toggleFadeOutBtn.addEventListener('click', () => {
            fadeOutTop = !fadeOutTop;
            wnd.classList[fadeOutTop ? "add" : "remove"]("fade-out-top");

            windowHeight = fadeOutTop ? fadeOutWindowHeight : normalWindowHeight;

            updateChatScroll(wnd);
            message(`${(fadeOutTop ? 'Właczono' : 'Wyłączono')} zanikanie górnej krawędzi chatu`);
            GM_setValue('yk-chatFadeOutTop', fadeOutTop ? '1' : '0');
        });
        $(toggleFadeOutBtn).tip("Włącz/Wyłącz zanikanie górnej krawędzi chatu");
        wnd.querySelector('.chat-input-wrapper .control-wrapper').appendChild(toggleFadeOutBtn);
    }

    /**
     * Creates and inserts the hover-hide checkbox element after .chat-config-wrapper.
     * @param {HTMLElement} wnd - The chat window element.
     */
    function hoverHideCheckbox(wnd) {
        const hoverHideCheckboxContainer = document.createElement('div');
        hoverHideCheckboxContainer.className = 'chat-hover-hide yk-checkbox';
        hoverHideCheckboxContainer.style.position = 'absolute';
        hoverHideCheckboxContainer.style.right = '99px';
        hoverHideCheckboxContainer.style.top = '5px';

        const hoverHideCheckboxInput = document.createElement('input');
        hoverHideCheckboxInput.type = 'checkbox';
        hoverHideCheckboxInput.className = 'chat-hover-hide-checkbox';
        hoverHideCheckboxInput.checked = hoverHide;


        const hoverDummy = document.createElement('div');
        hoverDummy.className = 'chat-hover-dummy';
        Object.assign(hoverDummy.style, {
            position: 'absolute',
            width: '100%',
            height: '100%',
            'z-index': '-1',
            'pointer-events': 'auto',
        });

        const borderImage = wnd.querySelector('.border-image');
        let borderHeightChanged = false;
        const scrollWrapper = wnd.querySelector('.scroll-wrapper');
        scrollWrapper.insertBefore(hoverDummy, scrollWrapper.firstChild);

        scrollWrapper.addEventListener('mouseenter', () => {
            if (hoverHide && !wnd.querySelector('magic_input:focus')) {
                scrollWrapper.classList.add("hover-hidden");
                if (!borderHeightChanged) {
                    borderImage.style.height = chatInputWrapperHeight + (fadeOutTop ? 15 : 0)+'px';
                    borderHeightChanged = true;
                }
            }
        });
        scrollWrapper.addEventListener('mouseleave', () => {
            if (hoverHide) {
                scrollWrapper.classList.remove("hover-hidden");
                if (borderHeightChanged) {
                    borderImage.style.height = borderImageHeight+'px';
                    borderHeightChanged = false;
                }
            }
        });
        scrollWrapper.addEventListener('mousedown', (e) => {
            if (hoverHide && wnd.querySelector('magic_input:focus')) {
                scrollWrapper.classList.add("supress");
                document.addEventListener('mouseup', function() {
                    setTimeout(()=>{
                        scrollWrapper.classList.remove("supress");
                        if (!wnd.querySelector('magic_input:focus')) {
                            const mouseMoveEvent = new MouseEvent('mousemove', {
                                bubbles: true,
                                cancelable: true,
                                clientX: 0,
                                clientY: 0
                            });
                            hoverDummy.dispatchEvent(mouseMoveEvent);
                        }
                    }, 1);
                }, { once: true });
            }
        });

        hoverDummy.addEventListener('mousemove', (e) => {
            if (hoverHide) {
                triggerGameCanvasMouseEvent(e);
                if (!borderHeightChanged) {
                    borderImage.style.height = chatInputWrapperHeight + (fadeOutTop ? 15 : 0)+'px';
                    borderHeightChanged = true;
                }
            }
        });

        hoverHideCheckboxInput.addEventListener('change', (e) => {
            hoverHide = e.currentTarget.checked;
            hoverHideCheckboxInput.checked = hoverHide;
            wnd.classList[hoverHide ? "add" : "remove"]("hover-hide");

            if (!hoverHide) {
                scrollWrapper.classList.remove("hover-hidden");
            }

            hoverHideCheckboxInput.blur();
            message(`${(hoverHide ? 'Właczono' : 'Wyłączono')} ukrywanie chatu po najechaniu kursorem`);
            GM_setValue('yk-chatHoverHide', hoverHide ? '1' : '0');
        });
        hoverHideCheckboxContainer.appendChild(hoverHideCheckboxInput);

        $(hoverHideCheckboxContainer).tip(`Włącz/Wyłącz ukrywanie chatu po najechaniu myszką!<br><br>Ułatwia podchodzenie w lewy dolny róg mapy.<br><br>Chat nie będzie ukrywany podczas pisania nowej wiadomości<br>(po wciśnięciu klawisza "Enter" lub kliknięciu na pole nowej wiadomości).<br>Dzięki temu możesz wciąż kliknąć na dowolny element czatu.`);
        wnd.querySelector('.chat-input-wrapper .control-wrapper').appendChild(hoverHideCheckboxContainer);
    }

    /**
     * Handles chat toggling.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function handleChatToggle(wnd) {
        intercept(Engine.chatController.getChatWindow(), 'chatToggle', () => {
            chatToggle(wnd, true);
        });

        const originalSetChat = Engine.interface.setChat;
        Engine.interface.setChat = function() {
            if(enabled && enterPressed) {
                return;
            }

            originalSetChat.call(this);
        };
    }

    /**
     * Toggles chat.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function chatToggle(wnd, saveChange = false) {
        if (saveChange) {
            enabled = !enabled;
            GM_setValue('yk-chatEnabled', enabled ? '1' : '0');
        }

        if (enabled) {
            document.querySelector('.left-column.main-column').style.zIndex = "0";
            wnd.classList.add("border-window", "transparent", "yk-chat-plus");
            if (fadeOutTop) {
                wnd.classList.add("fade-out-top");
            }
            if (hoverHide) {
                wnd.classList.add("hover-hide");
            }
        } else {
            document.querySelector('.left-column.main-column').style.zIndex = "";
            wnd.style.width = '';
            wnd.classList.remove("border-window", "transparent", "yk-chat-plus", "fade-out-top", "hover-hide");
        }

        setTimeout(()=>{alignMessageInput(wnd);},100);
    }

    /**
     * Handles chat clicking.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function hangleChatClick(wnd) {
        wnd.addEventListener('click', (e)=>{
            if (!wnd.classList.contains("yk-chat-plus")) {
                return;
            }

            if (excludedClickClases.some(className => e.target.classList.contains(className) || e.target.closest('.'+className))) {
                return;
            }

            triggerGameCanvasMouseEvent(e);
        });
    }

    /**
     * Propagates the mouse event to game canvas.
     * @param {Event} e - Initial mouse event.
     */
    function triggerGameCanvasMouseEvent(e) {
        const gameCanvas = Engine?.interface?.get$GAME_CANVAS();
        if (!gameCanvas) {
            return;
        }
        const canvas = gameCanvas[0];
        const canvasRect = canvas.getBoundingClientRect();

        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top + canvasRect.y;

        const canvasClickEvent = new MouseEvent(e.type, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
        });
        canvas.dispatchEvent(canvasClickEvent);
    }

    /**
     * Aligns the message input.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function alignMessageInput(wnd) {
        const magicInputWrapper = wnd.querySelector('.chat-input-wrapper .magic-input-wrapper');
        const bgAdditionalWidgetLeft = document.querySelector('.bg-additional-widget-left');
        const menuCard = wnd.querySelector('.chat-input-wrapper .menu-card');
        const listCard = wnd.querySelector('.chat-input-wrapper .card-list');
        const minWindowWidth = 1625;
        const minLengthDifference = 100;

        let buttonOffset = (parseInt(bgAdditionalWidgetLeft?.style?.width) || 0);
        let inputToSmall = minLengthDifference >= (chatWidth - buttonOffset);
        if (wnd.classList.contains("yk-chat-plus") && !inputToSmall) {
            let bottomBarVisible = isElementVisible(bgAdditionalWidgetLeft);

            let magicInputMargin = buttonOffset - 64;
            let cardMargin = buttonOffset - 133;

            magicInputWrapper.style.marginLeft = bottomBarVisible ? `${magicInputMargin}px` : '';
            menuCard.style.marginLeft = bottomBarVisible ? `${cardMargin}px` : '';
            listCard.style.marginLeft = bottomBarVisible ? `${cardMargin}px` : '';
        } else {
            magicInputWrapper.style.marginLeft = '';
            menuCard.style.marginLeft = '';
            listCard.style.marginLeft = '';
        }

        const borderImage = wnd.querySelector('.border-image');
        if (inputToSmall) {
            let additionalOffset = (parseInt(wnd?.style?.bottom) || 0);
            wnd.style.paddingBottom = additionalOffset+'px';
            borderImage.style.paddingTop = borderImage.style.height ? additionalOffset+'px' : '';
        } else {
            wnd.style.paddingBottom = '';
            borderImage.style.paddingTop = '';
        }

        let smallBattleScreen = (inBattle && minWindowWidth > window.innerWidth);

        updateChatScroll(wnd);
    }

    /**
     * Updates chat scroll position.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function updateChatScroll(wnd) {
        $(".scroll-wrapper", $(wnd)).trigger("update");
    }

    /**
     * Handles message input alignment.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function handleMessageInputAlignment(wnd) {
        const bgAdditionalWidgetLeft = document.querySelector('.bg-additional-widget-left');
        if (!bgAdditionalWidgetLeft) return;

        const resizeObserver = new ResizeObserver(() => {
            setTimeout(()=>{alignMessageInput(wnd);},100);
        });

        resizeObserver.observe(bgAdditionalWidgetLeft);
    }

    /**
     * Handles battle window states.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function handleBattle(wnd) {
        const battle = Engine.battle;
        function watchBattlePropertyChanges(obj, propertyName, callback) {
            let value = obj[propertyName];

            Object.defineProperty(obj, propertyName, {
                get() {
                    return value;
                },
                set(state) {
                    callback(state);
                    value = state;
                },
                configurable: true
            });
        }

        function onBattleChange(state) {
            if (inBattle !== state) {
                inBattle = state;
                setTimeout(()=>{alignMessageInput(wnd);},100);
            }
        }

        watchBattlePropertyChanges(battle, "show", onBattleChange);
    }

    /**
     * Handles other addons that collide with the chat window.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function handleOtherChatAddons() {
        const globalLootlog = document.getElementById('GLobalLootlogLauncher');
        const panelWalk = document.getElementById('PWLauncher');
        const licznikUbic = document.querySelector(".ga-universal-counter");
        const clanLootlogs = [...document.querySelectorAll(".cll-launcher")];

        [globalLootlog, panelWalk, licznikUbic, ...clanLootlogs].forEach(e => {
            if (e) {
                let offsetBottom = (parseInt(window.getComputedStyle(e).getPropertyValue('bottom')) || 15);
                e.style.bottom = (offsetBottom + windowHeight)+'px';
            }
        });
    }

    /**
     * Helper function to check if elements are visible in DOM.
     * @param {HTMLElement} element - The element that is being checked.
     */
    function isElementVisible(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);

        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none'
        );
    }

    // Start the script
    waitForChatWindow();
})();
