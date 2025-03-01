// ==UserScript==
// @name         Chat Window+ (ChatW+) [NI]
// @namespace    http://tampermonkey.net/
// @version      2.0.0
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
// @grant        GM_deleteValue
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const normalWindowHeight = 297;
    const fadeOutWindowHeight = 12;
    const chatInputWrapperHeight = 57;
    const excludedClickClasses = [
        "chat-channel-card",
        "chat-channel-card-icon",
        "magic-input",
        "card-name",
        "card-remove",
        "card-list",
        "link",
        "chat-config-wrapper",
        "chat-config-wrapper-button",
        "settings-button",
        "increase-opacity",
        "chat-hover-hide-checkbox",
        "click-able",
        "close-button-corner-decor"
    ];

    let fadeOutTop = Boolean(parseInt(GM_getValue('yk-chatFadeOutTop', '1'), 10));
    let chatDrag = Boolean(parseInt(GM_getValue('yk-chatDrag', '0'), 10));
    let chatDragLock = Boolean(parseInt(GM_getValue('yk-chatDragLock', '0'), 10));
    let chatCardsDrag = Boolean(parseInt(GM_getValue('yk-chatCardsDrag', '0'), 10));
    let chatCardsDragLock = Boolean(parseInt(GM_getValue('yk-chatCardsDragLock', '0'), 10));
    let hoverHide = Boolean(parseInt(GM_getValue('yk-chatHoverHide', '0'), 10));
    let borderImageHeight = 0;

    let chatHeight, chatWidth, chatScale;

    let chatState = parseInt(GM_getValue('yk-chatState', '1'), 10);
    let enabled = (chatState === 1);
    let draggable = Boolean(parseInt(GM_getValue('yk-chatDraggable', '0'), 10));
    let inBattle = false;

    let settingsWnd = null;
    let enterPressed = false;

    document.addEventListener('keydown', (e) => {
        if (e.keyCode === 13 && enabled) {
            if (enterPressed) return;
            enterPressed = true;
        }
    });
    document.addEventListener('keyup', () => {
        enterPressed = false;
    });

    const STYLE_CONTENT = `
    input.yk-input, .select.yk-select {
        border-radius: 5px;
        background: #3b3b3b;
        color: wheat;
        text-align: center;
        cursor: url("../img/gui/cursor/1n.png?v=1740746137089"), url("../img/gui/cursor/1n.cur?v=1740746137089"), auto !important;
    }
    label.yk-label {
        cursor: url("../img/gui/cursor/1n.png?v=1740746137089"), url("../img/gui/cursor/1n.cur?v=1740746137089"), auto !important;
    }

    .chat-size-0 .left-column.main-column {
        display: block !important;
    }
    .chat-size-0 .left-column.main-column > .border {
        display: none;
    }
    .chat-size-0 .yk-chat-plus {
        min-height: ${normalWindowHeight}px;
        width: auto;
        top: auto;
        left: -2px;
        bottom: 0 !important;
        pointer-events: none;
        transform-origin: bottom left;
    }
    .chat-size-0 .yk-chat-plus > * {
        pointer-events: auto;
    }
    .chat-size-0 .yk-chat-plus.fade-out-top {
        min-height: ${normalWindowHeight + fadeOutWindowHeight}px;
    }
    .chat-size-0 .yk-chat-plus .chat-input-wrapper {
        width: 100%;
        z-index: 0;
    }
    .chat-size-0 .yk-chat-plus .chat-input-wrapper > * {
        margin: 0 1rem 0 2.5rem;
    }
    .chat-size-0 .yk-chat-plus .magic-input-wrapper {
        margin-bottom: 0.4rem;
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
        bottom: 265px;
        z-index: 1;
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
        right: 39px;
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
    .chat-size-1 .new-chat-window:not(.yk-chat-plus) .chat-input-wrapper .control-wrapper .settings-button,
    .chat-size-1 .new-chat-window:not(.yk-chat-plus) .chat-input-wrapper .control-wrapper .close-button-corner-decor,
    .chat-size-1 .new-chat-window:not(.yk-chat-plus) .chat-input-wrapper .control-wrapper .chat-hover-hide {
        display: none;
    }
    `;

    // Waits for the chat window to be ready and initializes it.
    const waitForChatWindow = () => {
        const interval = setInterval(() => {
            if (typeof Engine !== 'undefined' &&
                Engine?.chatController?.getChatWindow()?.get$chatWindow) {
                clearInterval(interval);
                GM_addStyle(STYLE_CONTENT);
                initializeChatWindow();
            }
        }, 100);
    };

    // Initializes the chat window modifications.
    const initializeChatWindow = () => {
        const wnd = Engine?.chatController?.getChatWindow()?.get$chatWindow()[0];
        if (!wnd) return;

        customizeWindowAppearance(wnd);
        customizeChatSettings(wnd);
        hoverHideCheckbox(wnd);

        handleChatExit(wnd);
        hangleChatClick(wnd);
        handleMessageInputAlignment(wnd);
        handleBattle(wnd);

        const interval = setInterval(() => {
            const gameWindowPositioner = document.querySelector('.game-window-positioner');
            if (!gameWindowPositioner) return;

            const hasChatSizeClass = Array.from(gameWindowPositioner.classList)
                .some(className => className.startsWith('chat-size-'));
            if (Engine?.allInit && hasChatSizeClass) {
                clearInterval(interval);
                setTimeout(() => {
                    if (document.querySelector('.game-window-positioner')
                        .classList.contains('chat-size-' + (enabled ? '1' : '0'))) {
                        Engine.chatController.getChatWindow().chatToggle();
                    }
                    chatToggle(wnd);
                    handleChatToggle(wnd);
                    setTimeout(() => {
                        const scrollPane = wnd.querySelector('.scroll-pane');
                        scrollPane.scrollTop = scrollPane.scrollHeight - scrollPane.clientHeight;
                        updateChatScroll(wnd);
                    }, 1);

                    setTimeout(() => {
                        handleOtherChatAddons();
                    }, 2000);
                }, 1);
            }
        }, 100);
    };

    /**
     * Customizes the appearance of the chat window.
     * @param {HTMLElement} wnd - The chat window element.
     */
    const customizeWindowAppearance = (wnd) => {
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
            position: 'absolute'
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
    };

    const customizeChatSettings = (wnd) => {
        const settingsContent = $(`
            <div class="chat-configure-window" style="height: 210px;width: 250px;">
                <div class="scroll-wrapper classic-bar scrollable">
                    <div class="scroll-pane">
                        <div class="middle-graphic interface-element-middle-1-background"></div>
                        <div class="notification-text" style="text-align: center;">
                            <div style="margin-bottom: 0.5rem;">
                                <label for="yk-chat-height" class="yk-label">Wysokość czatu [px]:</label>
                                <input type="number" id="yk-chat-height" class="yk-input">
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <label for="yk-chat-width" class="yk-label">Szerokość czatu [px]:</label>
                                <input type="number" id="yk-chat-width" class="yk-input">
                            </div>
                            <div>
                                <label for="yk-chat-scale" class="yk-label">Skala [%]:</label>
                                <input type="number" id="yk-chat-scale" class="yk-input">
                            </div>
                        </div>
                        <div class="notification-text">
                            <div style="margin-bottom: 1rem;">
                                <input type="checkbox" id="yk-chat-fadeout">
                                <label for="yk-chat-fadeout" class="yk-label">Zanikanie górnej krawędzi chatu</label>
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <input type="checkbox" id="yk-chat-draggable">
                                <label for="yk-chat-draggable" class="yk-label">Zmiana pozycji czatu</label>
                            </div>
                            <div id="chat-draggable-lock-wrapper" style="margin-bottom: 1rem;margin-left: 1rem;font-size: 0.75rem;display: none;">
                                <input type="checkbox" id="yk-chat-draggable-lock">
                                <label for="yk-chat-draggable-lock" class="yk-label">Zablokuj czat w aktualnej pozycji</label>
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <input type="checkbox" id="yk-chat-cards-draggable">
                                <label for="yk-chat-cards-draggable" class="yk-label">Zmiana pozycji zakładek czatu</label>
                            </div>
                            <div id="chat-cards-draggable-lock-wrapper" style="margin-left: 1rem;font-size: 0.75rem;display: none;">
                                <input type="checkbox" id="yk-chat-cards-draggable-lock">
                                <label for="yk-chat-cards-draggable-lock" class="yk-label">Zablokuj zakładki w aktualnej pozycji</label>
                            </div>
                            <div class="info-box" id="error-box" style="display: none;color: red;font-weight: bold;line-height: 1rem;"></div>
                        </div>
                        <div class="notification-text" style="text-align: center;">
                            <div id="reset-chat-settings-btn" class="button small"><div class="background"></div><div class="label" style="font-size: 11px;">Resetuj ustawienia</div></div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        evtOnChatHeightChange(wnd, settingsContent);
        evtOnChatWidthChange(wnd, settingsContent);
        evtOnChatScaleChange(wnd, settingsContent);
        evtOnToggleFadeOutTopChange(wnd, settingsContent);
        evtOnToggleChatDrag(wnd, settingsContent);
        evtOnToggleChatCardsDrag(wnd, settingsContent);
        evtOnToggleChatDragLock(wnd, settingsContent);
        evtOnToggleChatCardsDragLock(wnd, settingsContent);
        evtOnChatSettingsReset(wnd, settingsContent);

        const windowName = 'yk-cwp-settings-wnd';
        Engine.windowsData.name[windowName] = windowName;

        settingsWnd = Engine.windowManager.add({
            content    : settingsContent,
            title      : 'Opcje Chat Window+',
            nameWindow : windowName,
            onclose    : () => { settingsWnd.toggle(); }
        });
        settingsWnd.hide();
        settingsWnd.addToAlertLayer();
        settingsWnd.center();

        // Create chat settings button
        const chatPlusSettingsBtn = document.createElement('div');
        chatPlusSettingsBtn.className = 'settings-button';
        Object.assign(chatPlusSettingsBtn.style, {
            top: '1px',
            left: 'auto',
            right: '18px',
            margin: '5px',
            position: 'absolute'
        });

        chatPlusSettingsBtn.addEventListener('click', () => { openSettings(wnd); });
        $(chatPlusSettingsBtn).one('click', () => {
            settingsContent.find('.scroll-wrapper').addScrollBar({track: true});
            $('.scroll-wrapper', settingsContent).trigger('update');
        });
        $(chatPlusSettingsBtn).tip("Opcje Chat Window+");
        wnd.querySelector('.chat-input-wrapper .control-wrapper').appendChild(chatPlusSettingsBtn);
    };

    const openSettings = (wnd) => {
        if (settingsWnd) {
            settingsWnd.toggle();
        }
    };

    /**
     * Adds functionality to change height of the chat window.
     */
    const evtOnChatHeightChange = (wnd, settingsContent) => {
        const MIN_HEIGHT = 50; //px
        const DEFAULT_HEIGHT = 250; //px
        const STEP = 5; //px

        const chatMessageWrapper = wnd.querySelector('.chat-message-wrapper');
        if (!chatMessageWrapper) return;

        const borderImage = wnd.querySelector('.border-image');

        const storedHeight = parseInt(GM_getValue('yk-chatHeight', DEFAULT_HEIGHT.toString()), 10);
        const initialHeight = isNaN(storedHeight) ? DEFAULT_HEIGHT : storedHeight;

        chatMessageWrapper.style.height = `${initialHeight}px`;
        borderImageHeight = initialHeight + chatInputWrapperHeight;
        borderImage.style.height = borderImageHeight <= 0 ? '' : `${borderImageHeight}px`;
        chatHeight = initialHeight;

        const heightInput = settingsContent.find('#yk-chat-height');
        heightInput.attr('min', MIN_HEIGHT);
        heightInput.attr('step', STEP);
        heightInput.val(initialHeight).on('input change', () => {
            let currentHeight = parseInt(heightInput.val());
            currentHeight = currentHeight < MIN_HEIGHT ? MIN_HEIGHT : currentHeight;

            chatMessageWrapper.style.height = `${currentHeight}px`;
            borderImageHeight = currentHeight + chatInputWrapperHeight;
            borderImage.style.height = borderImageHeight <= 0 ? '' : `${borderImageHeight}px`;
            chatHeight = currentHeight;
            if (chatDrag && enabled) {
                let dragHeight = currentHeight;
                if (dragHeight > (normalWindowHeight - chatInputWrapperHeight)) {
                    borderImage.style.height = '';
                    dragHeight += chatInputWrapperHeight;
                }
                $(wnd).css('height', dragHeight);
            }

            setTimeout(() => { alignMessageInput(wnd); }, 100);
            GM_setValue('yk-chatHeight', currentHeight.toString());
        });
    };

    /**
     * Adds functionality to change width of the chat window.
     */
    const evtOnChatWidthChange = (wnd, settingsContent) => {
        const MIN_WIDTH = 250; //px
        const DEFAULT_WIDTH = 500; //px
        const STEP = 5; //px

        const storedWidth = parseInt(GM_getValue('yk-chatWidth', DEFAULT_WIDTH.toString()), 10);
        const initialWidth = isNaN(storedWidth) ? DEFAULT_WIDTH : storedWidth;
        if (enabled) {
            wnd.style.width = `${initialWidth}px`;
            chatWidth = initialWidth;
        }

        const resizeObserver = new ResizeObserver(() => {
            if (!enabled) return;
            const storedWidth = parseInt(GM_getValue('yk-chatWidth', DEFAULT_WIDTH.toString()), 10);
            const initialWidth = isNaN(storedWidth) ? DEFAULT_WIDTH : storedWidth;
            wnd.style.width = `${initialWidth}px`;
            chatWidth = initialWidth;
        });
        resizeObserver.observe(wnd);

        const widthInput = settingsContent.find('#yk-chat-width');
        widthInput.attr('min', MIN_WIDTH);
        widthInput.attr('step', STEP);
        widthInput.val(initialWidth).on('input change', () => {
            let currentWidth = parseInt(widthInput.val());
            currentWidth = currentWidth < MIN_WIDTH ? MIN_WIDTH : currentWidth;
            chatWidth = currentWidth;

            if (enabled) {
                wnd.style.width = `${currentWidth}px`;
            }

            setTimeout(() => { alignMessageInput(wnd); }, 100);
            GM_setValue('yk-chatWidth', currentWidth.toString());
        });
    };

    const evtOnChatScaleChange = (wnd, settingsContent) => {
        const MIN_SCALE = 50; //%
        const DEFAULT_SCALE = 100; //%
        const STEP = 1; //%

        const storedScale = parseInt(GM_getValue('yk-chatScale', DEFAULT_SCALE.toString()), 10);
        const initialScale = isNaN(storedScale) ? DEFAULT_SCALE : storedScale;
        if (enabled) {
            wnd.style.transform = `scale(${initialScale / 100})`;
            chatScale = initialScale;
        }

        const scaleInput = settingsContent.find('#yk-chat-scale');
        scaleInput.attr('min', MIN_SCALE);
        scaleInput.attr('step', STEP);
        scaleInput.val(initialScale).on('input change', () => {
            let currentScale = parseInt(scaleInput.val());
            currentScale = currentScale < MIN_SCALE ? MIN_SCALE : currentScale;
            chatScale = currentScale;

            if (enabled) {
                 wnd.style.transform = `scale(${currentScale / 100})`;
            }

            setTimeout(() => { alignMessageInput(wnd); }, 100);
            GM_setValue('yk-chatScale', currentScale.toString());
        });
    };

    /**
     * Adds functionality to toggle fading out of window top edge.
     */
    const evtOnToggleFadeOutTopChange = (wnd, settingsContent) => {
        const toggleFadeOutCheck = settingsContent.find('#yk-chat-fadeout');
        toggleFadeOutCheck.prop('checked', fadeOutTop);
        toggleFadeOutCheck.on('change', () => {
            fadeOutTop = toggleFadeOutCheck.is(':checked');
            wnd.classList[fadeOutTop ? "add" : "remove"]("fade-out-top");

            updateChatScroll(wnd);
            GM_setValue('yk-chatFadeOutTop', fadeOutTop ? '1' : '0');
        });
    };

    const evtOnToggleChatDrag = (wnd, settingsContent) => {
        const chatDraggableLockWrapper = settingsContent.find('#chat-draggable-lock-wrapper');
        if (chatDrag) {
            toggleChatDraggable(wnd, chatDrag, settingsContent);
            chatDraggableLockWrapper.show();
        }

        const toggleChatDragCheck = settingsContent.find('#yk-chat-draggable');
        toggleChatDragCheck.prop('checked', chatDrag);
        toggleChatDragCheck.on('change', () => {
            chatDrag = toggleChatDragCheck.is(':checked');
            if (!chatDrag) {
                GM_deleteValue('yk-chat-pos');
                GM_deleteValue('yk-chat-cards-pos');
                chatDraggableLockWrapper.slideUp('fast');
            } else {
                chatDraggableLockWrapper.find('#yk-chat-draggable-lock')
                    .prop('checked', false)
                    .trigger('change');
                console.log(chatDraggableLockWrapper.find('#yk-chat-draggable-lock'));
                chatDraggableLockWrapper.slideDown('fast');
            }
            toggleChatDraggable(wnd, chatDrag, settingsContent);
            GM_setValue('yk-chatDrag', chatDrag ? '1' : '0');
        });
    };

    const evtOnToggleChatCardsDrag = (wnd, settingsContent) => {
        const chatCardsDraggableLockWrapper = settingsContent.find('#chat-cards-draggable-lock-wrapper');
        if (chatCardsDrag) {
            toggleChatCardsDraggable(wnd, chatDrag);
            chatCardsDraggableLockWrapper.show();
        }

        const toggleChatCardsDragCheck = settingsContent.find('#yk-chat-cards-draggable');
        toggleChatCardsDragCheck.prop('checked', chatCardsDrag);
        toggleChatCardsDragCheck.on('change', () => {
            chatCardsDrag = toggleChatCardsDragCheck.is(':checked');
            if (!chatCardsDrag) {
                GM_deleteValue('yk-chat-cards-pos');
                chatCardsDraggableLockWrapper.slideUp('fast');
                settingsContent.find('#error-box').html('Wymagane odświeżenie strony!<div class="button small green" style="margin-left: 0.25rem!important;" onclick="window.location.reload();"><div class="background"></div><div class="label" style="font-size: 11px;">Odśwież</div></div>').fadeIn();
            } else {
                chatCardsDraggableLockWrapper.find('#yk-chat-cards-draggable-lock')
                    .prop('checked', false)
                    .trigger('change');
                console.log(chatCardsDraggableLockWrapper.find('#yk-chat-cards-draggable-lock'));
                chatCardsDraggableLockWrapper.slideDown('fast');
            }
            toggleChatCardsDraggable(wnd, chatCardsDrag);
            GM_setValue('yk-chatCardsDrag', chatCardsDrag ? '1' : '0');
        });
    };

    const evtOnToggleChatDragLock = (wnd, settingsContent) => {
        const toggleChatDraggableLock = settingsContent.find('#yk-chat-draggable-lock');
        toggleChatDraggableLock.prop('checked', chatDragLock);
        toggleChatDraggableLock.on('change', () => {
            chatDragLock = toggleChatDraggableLock.is(':checked');
            const chatContainer = $(wnd);
            if (chatContainer.hasClass("ui-draggable")) {
                chatContainer.draggable(chatDragLock ? 'disable' : 'enable');
            }
            GM_setValue('yk-chatDragLock', chatDragLock ? '1' : '0');
        });
    };

    const evtOnToggleChatCardsDragLock = (wnd, settingsContent) => {
        const toggleChatCardsDraggableLock = settingsContent.find('#yk-chat-cards-draggable-lock');
        toggleChatCardsDraggableLock.prop('checked', chatCardsDragLock);
        toggleChatCardsDraggableLock.on('change', () => {
            chatCardsDragLock = toggleChatCardsDraggableLock.is(':checked');
            const cardContainer = $(wnd).find('.chat-channel-card-wrapper');
            if (cardContainer.hasClass("ui-draggable")) {
                cardContainer.draggable(chatCardsDragLock ? 'disable' : 'enable');
            }
            GM_setValue('yk-chatCardsDragLock', chatCardsDragLock ? '1' : '0');
        });
    };

    const evtOnChatSettingsReset = (wnd, settingsContent) => {
        const resetSettingsBtn = settingsContent.find('#reset-chat-settings-btn');
        resetSettingsBtn.on('click', () => {
            const DEFAULT_HEIGHT = 250; //px
            const DEFAULT_WIDTH = 500; //px
            const DEFAULT_SCALE = 100; //%

            const heightInput = settingsContent.find('#yk-chat-height');
            const widthInput = settingsContent.find('#yk-chat-width');
            const scaleInput = settingsContent.find('#yk-chat-scale');
            const toggleFadeOutCheck = settingsContent.find('#yk-chat-fadeout');
            const toggleChatDragCheck = settingsContent.find('#yk-chat-draggable');
            const toggleChatCardsDragCheck = settingsContent.find('#yk-chat-cards-draggable');

            heightInput.val(DEFAULT_HEIGHT).trigger('change');
            widthInput.val(DEFAULT_WIDTH).trigger('change');
            scaleInput.val(DEFAULT_SCALE).trigger('change');
            toggleFadeOutCheck.prop('checked', true).trigger('change');
            toggleChatDragCheck.prop('checked', false).trigger('change');
            toggleChatCardsDragCheck.prop('checked', false).trigger('change');

            message('Ustawienia chatu zostały zresetowane');
        });
    };

    const toggleChatDraggable = (wnd, active, settingsContent) => {
        const chatContainer = $(wnd);
        if (active) {
            if (chatContainer.hasClass("ui-draggable-disabled")) {
                chatContainer.draggable('enable');
            } else {
                chatContainer.draggable({
                    containment: '.interface-layer',
                    start: () => { chatContainer.css('cursor', 'grabbing'); },
                    stop: () => {
                        chatContainer.css('cursor', '');
                        const left = chatContainer.css('left');
                        const top = chatContainer.css('top');
                        GM_setValue('yk-chat-pos', JSON.stringify({ left, top }));
                    }
                });
            }
            const savedChatPosition = GM_getValue('yk-chat-pos', null);
            if (savedChatPosition) {
                const { left, top } = JSON.parse(savedChatPosition);
                chatContainer.css({ left, top });
            }
            document.querySelector('.left-column.main-column').style.zIndex = "1";
        } else if (chatContainer.hasClass("ui-draggable")) {
            chatContainer.draggable('disable');
            chatContainer.css({ 'height': '', 'top': '', 'left': '' });
            document.querySelector('.left-column.main-column').style.zIndex = (enabled) ? "0" : "";
            $(wnd).find('.chat-channel-card-wrapper').css({ 'top': '', 'left': '' });
        }
        settingsContent.find('#yk-chat-height').trigger('change');
    };

    const toggleChatCardsDraggable = (wnd, active) => {
        const cardContainer = $(wnd).find('.chat-channel-card-wrapper');
        if (active) {
            if (cardContainer.hasClass("ui-draggable-disabled")) {
                cardContainer.draggable('enable');
            } else {
                cardContainer.draggable({
                    containment: '.interface-layer',
                    start: () => { cardContainer.css('cursor', 'grabbing'); },
                    stop: () => {
                        cardContainer.css('cursor', '');
                        const left = cardContainer.css('left');
                        const top = cardContainer.css('top');
                        GM_setValue('yk-chat-cards-pos', JSON.stringify({ left, top }));
                    }
                });
            }
            const savedChatCardsPosition = GM_getValue('yk-chat-cards-pos', null);
            if (savedChatCardsPosition) {
                const { left, top } = JSON.parse(savedChatCardsPosition);
                cardContainer.css({ left, top });
            }
        } else if (cardContainer.hasClass("ui-draggable")) {
            cardContainer.draggable('disable');
            $(wnd).find('.chat-channel-card-wrapper').css({ 'top': '', 'left': '' });
        }
        wnd.querySelector('.chat-message-wrapper').style.marginLeft = (enabled ? (active ? '4px' : '33px') : '');
    };

    /**
     * Creates and inserts the hover-hide checkbox element.
     */
    const hoverHideCheckbox = (wnd) => {
        const hoverHideCheckboxContainer = document.createElement('div');
        hoverHideCheckboxContainer.className = 'chat-hover-hide yk-checkbox';
        Object.assign(hoverHideCheckboxContainer.style, {
            position: 'absolute',
            right: '61px',
            top: '5px'
        });

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
            zIndex: '-1',
            pointerEvents: 'auto'
        });

        const borderImage = wnd.querySelector('.border-image');
        let borderHeightChanged = false;
        const scrollWrapper = wnd.querySelector('.scroll-wrapper');
        scrollWrapper.insertBefore(hoverDummy, scrollWrapper.firstChild);

        scrollWrapper.addEventListener('mouseenter', () => {
            if (hoverHide && !wnd.querySelector('magic_input:focus')) {
                scrollWrapper.classList.add("hover-hidden");
                if (!borderHeightChanged) {
                    borderImage.style.height = chatInputWrapperHeight + (fadeOutTop ? 15 : 0) + 'px';
                    borderHeightChanged = true;
                }
            }
        });
        scrollWrapper.addEventListener('mouseleave', () => {
            if (hoverHide) {
                scrollWrapper.classList.remove("hover-hidden");
                if (borderHeightChanged) {
                    borderImage.style.height = borderImageHeight === 0 ? '' : `${borderImageHeight}px`;
                    borderHeightChanged = false;
                }
            }
        });
        scrollWrapper.addEventListener('mousedown', (e) => {
            if (hoverHide && wnd.querySelector('magic_input:focus')) {
                scrollWrapper.classList.add("supress");
                document.addEventListener('mouseup', () => {
                    setTimeout(() => {
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
                    borderImage.style.height = chatInputWrapperHeight + (fadeOutTop ? 15 : 0) + 'px';
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
    };

    /**
     * Handles chat toggling.
     */
    const handleChatToggle = (wnd) => {
        const originalChatToggle = Engine.chatController.getChatWindow().chatToggle;
        Engine.chatController.getChatWindow().chatToggle = function (...args) {
            const r = chatToggle(wnd, true);
            if (!r) return;
            originalChatToggle.call(this, ...args);
        };

        const originalSetChat = Engine.interface.setChat;
        Engine.interface.setChat = function () {
            if (enabled && enterPressed) return;
            originalSetChat.call(this);
        };
    };

    /**
     * Toggles chat.
     */
    const chatToggle = (wnd, saveChange = false) => {
        if (saveChange) {
            chatState = ++chatState % 3;
            enabled = (chatState === 1);
            GM_setValue('yk-chatState', chatState ? '1' : '0');

            if (chatState === 2) {
                wnd.style.display = 'none';
                return;
            }
            wnd.style.display = '';
        }

        if (enabled) {
            document.querySelector('.left-column.main-column').style.zIndex = "0";
            wnd.classList.add("border-window", "transparent", "yk-chat-plus");
            if (fadeOutTop) wnd.classList.add("fade-out-top");
            if (hoverHide) wnd.classList.add("hover-hide");
        } else {
            document.querySelector('.left-column.main-column').style.zIndex = "";
            wnd.style.width = '';
            wnd.style.transform = '';
            wnd.classList.remove("border-window", "transparent", "yk-chat-plus", "fade-out-top", "hover-hide");
        }

        // Chat position
        if (settingsWnd) {
            toggleChatDraggable(wnd, (chatDrag && enabled), settingsWnd.$);
            toggleChatCardsDraggable(wnd, (chatCardsDrag && enabled));

            if (enabled) {
                const chatContainer = $(wnd);
                if (chatContainer.hasClass("ui-draggable")) {
                    chatContainer.draggable(chatDragLock ? 'disable' : 'enable');
                }
                const cardContainer = $(wnd).find('.chat-channel-card-wrapper');
                if (cardContainer.hasClass("ui-draggable")) {
                    cardContainer.draggable(chatCardsDragLock ? 'disable' : 'enable');
                }
            }
        }

        setTimeout(() => { alignMessageInput(wnd); }, 100);
        return true;
    };

    const handleChatExit = (wnd) => {
        const closeChatBtnWrapper = document.createElement('div');
        closeChatBtnWrapper.className = 'close-button-corner-decor';
        Object.assign(closeChatBtnWrapper.style, {
            position: 'absolute',
            right: '80px',
            top: '3px'
        });

        const closeChatBtn = document.createElement('button');
        closeChatBtn.type = 'button';
        closeChatBtn.className = 'close-button';
        closeChatBtnWrapper.appendChild(closeChatBtn);
        closeChatBtnWrapper.addEventListener('click', () => { chatToggle(wnd, true); });
        $(closeChatBtnWrapper).tip("Wyłącz chat");
        wnd.querySelector('.chat-input-wrapper .control-wrapper').appendChild(closeChatBtnWrapper);
    };

    /**
     * Handles chat clicking.
     */
    const hangleChatClick = (wnd) => {
        wnd.addEventListener('click', (e) => {
            if (!wnd.classList.contains("yk-chat-plus")) return;
            if (excludedClickClasses.some(className => e.target.classList.contains(className) || e.target.closest('.' + className))) return;
            triggerGameCanvasMouseEvent(e);
        });
    };

    /**
     * Propagates the mouse event to game canvas.
     */
    const triggerGameCanvasMouseEvent = (e) => {
        const gameCanvas = Engine?.interface?.get$GAME_CANVAS();
        if (!gameCanvas) return;
        const canvas = gameCanvas[0];
        const bodyRect = document.body.getBoundingClientRect();
        const x = e.clientX - bodyRect.left;
        const y = e.clientY - bodyRect.top + bodyRect.y;
        const canvasClickEvent = new MouseEvent(e.type, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
        });
        canvas.dispatchEvent(canvasClickEvent);
    };

    /**
     * Aligns the message input.
     */
    const alignMessageInput = (wnd) => {
        const magicInputWrapper = wnd.querySelector('.chat-input-wrapper .magic-input-wrapper');
        const bgAdditionalWidgetLeft = document.querySelector('.bg-additional-widget-left');
        const menuCard = wnd.querySelector('.chat-input-wrapper .menu-card');
        const listCard = wnd.querySelector('.chat-input-wrapper .card-list');
        const minWindowWidth = 1625;
        const minLengthDifference = 100;

        let buttonOffset = parseInt(bgAdditionalWidgetLeft?.style?.width) || 0;
        const inputTooSmall = (chatWidth - buttonOffset) <= minLengthDifference;
        if (wnd.classList.contains("yk-chat-plus") && !inputTooSmall && !chatDrag) {
            const bottomBarVisible = isElementVisible(bgAdditionalWidgetLeft);
            const magicInputMargin = buttonOffset - 64;
            const cardMargin = buttonOffset - 133;
            magicInputWrapper.style.marginLeft = bottomBarVisible ? `${magicInputMargin}px` : '';
            menuCard.style.marginLeft = bottomBarVisible ? `${cardMargin}px` : '';
            listCard.style.marginLeft = bottomBarVisible ? `${cardMargin}px` : '';
        } else {
            magicInputWrapper.style.marginLeft = '';
            menuCard.style.marginLeft = '';
            listCard.style.marginLeft = '';
        }

        const borderImage = wnd.querySelector('.border-image');
        if (inputTooSmall && enabled) {
            let additionalOffset = parseInt(wnd?.style?.bottom) || 0;
            wnd.style.paddingBottom = additionalOffset + 'px';
            borderImage.style.paddingTop = borderImage.style.height ? additionalOffset + 'px' : '';
        } else {
            wnd.style.paddingBottom = '';
            borderImage.style.paddingTop = '';
        }

        updateChatScroll(wnd);
    };

    const updateChatScroll = (wnd) => {
        $(".scroll-wrapper", $(wnd)).trigger("update");
    };

    /**
     * Handles message input alignment.
     */
    const handleMessageInputAlignment = (wnd) => {
        const bgAdditionalWidgetLeft = document.querySelector('.bg-additional-widget-left');
        if (!bgAdditionalWidgetLeft) return;
        const resizeObserver = new ResizeObserver(() => {
            setTimeout(() => { alignMessageInput(wnd); }, 100);
        });
        resizeObserver.observe(bgAdditionalWidgetLeft);
    };

    /**
     * Handles battle window states.
     */
    const handleBattle = (wnd) => {
        const battle = Engine.battle;
        const watchBattlePropertyChanges = (obj, propertyName, callback) => {
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
        };

        const onBattleChange = (state) => {
            if (inBattle !== state) {
                inBattle = state;
                setTimeout(() => { alignMessageInput(wnd); }, 100);
            }
        };

        watchBattlePropertyChanges(battle, "show", onBattleChange);
    };

    /**
     * Handles other addons that collide with the chat window.
     */
    const handleOtherChatAddons = () => {
        const globalLootlog = document.getElementById('GLobalLootlogLauncher');
        const panelWalk = document.getElementById('PWLauncher');
        const licznikUbic = document.querySelector(".ga-universal-counter");
        const clanLootlogs = [...document.querySelectorAll(".cll-launcher")];

        [globalLootlog, panelWalk, licznikUbic, ...clanLootlogs].forEach(e => {
            if (e) {
                const offsetBottom = parseInt(window.getComputedStyle(e).getPropertyValue('bottom')) || 15;
                e.style.bottom = (offsetBottom + normalWindowHeight + 15) + 'px';
            }
        });
    };

    /**
     * Helper function to check if an element is visible.
     */
    const isElementVisible = (element) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none'
        );
    };

    // Start the script
    waitForChatWindow();
})();
