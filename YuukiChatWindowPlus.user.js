// ==UserScript==
// @name         Chat Window+ (ChatW+) [NI]
// @namespace    http://tampermonkey.net/
// @version      1.2
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
// @require      https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.3/Sortable.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=margonem.pl
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    var enabled = false;
    var inBattle = false;

    var enterPressed = false;
    var isTyping = false;
    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 13 && enabled) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            if (enterPressed) {
                return;
            }
            enterPressed = true;

            const magicInput = document.querySelector('magic_input');
            if (!magicInput) {
                return;
            }

            if (!document.querySelector(':focus') && !isTyping) {
                isTyping = true;
                $(magicInput).focus();
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }

            return false;
        }
    });
    document.addEventListener('keyup', function(e) {
        enterPressed = false;
    });

    const STYLE_CONTENT = `
        .chat-size-0 .left-column.main-column {
            display: block!important;
        }
        .chat-size-0 .yk-chat-plus {
            bottom: 0!important;
            top: auto;
            width: 550px;
            height: 309px;
        }
        .chat-size-0 .yk-chat-plus .chat-input-wrapper {
            width: 100%;
        }
        .chat-size-0 .yk-chat-plus .chat-input-wrapper > * {
            margin: 0 16px 0 34px;
        }
        .chat-size-0 .yk-chat-plus .magic-input-wrapper {
            margin-bottom: 8px;
        }
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .magic-input-placeholder {
            color: #c9c9c9!important;
            height: 17px;
            overflow: hidden;
        }
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .magic-input {
            box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 3px 3px inset!important;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper.chat-message-wrapper.scrollable {
            position: relative!important;
        }
        .chat-size-0 .yk-chat-plus .chat-channel-card-wrapper {
            position: absolute;
            display: flex;
            flex-direction: column;
        }
        .chat-size-0 .yk-chat-plus .chat-channel-card-wrapper .chat-channel-card {
            background: #00000052;
            border-radius: 2px;
        }
        .chat-size-0 .yk-chat-plus.border-window.transparent .scroll-wrapper {
            margin-left: 33px;
        }
        .chat-size-0 .yk-chat-plus .new-chat-message.expired-message {
            opacity: 0.75;
        }
        .chat-size-0 .yk-chat-plus .chat-info-wrapper {
            right: 48px;
        }
        .chat-size-0 .yk-chat-plus .chat-config-wrapper {
            right: 19px;
        }

        .chat-size-0 .yk-chat-plus .scroll-wrapper {
            mask-image: linear-gradient(to bottom, transparent, black 26px, #000000);
            -webkit-mask-image: linear-gradient(to bottom, transparent, black 26px, #000000);
        }
        .chat-size-0 .yk-chat-plus .border-image {
            mask-image: linear-gradient(to bottom, transparent, black 28px, #000000);
            -webkit-mask-image: linear-gradient(to bottom, transparent, black 28px, #000000);
        }
        .chat-size-0 .yk-chat-plus .chat-channel-card-wrapper {
            margin-top: 12px !important;
        }
        .chat-size-0 .yk-chat-plus .scrollbar-wrapper {
            margin-top: 20px !important;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper {
            height: calc(100% - 20px);
        }

        .chat-size-0 .yk-chat-plus .border-image {
            margin-top: 6px !important;
        }
        .chat-size-0 .yk-chat-plus .border-image {
            height: calc(100% - 6px);
        }


        /* Scroll */
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper {
            right: 0;
            margin-left: 33px;
        }
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="0"] .scrollbar-wrapper {
            opacity: 0.25;
        }
        .chat-size-0 .yk-chat-plus:not(:hover) .scrollbar-wrapper:not(:active) {
            visibility: hidden;
        }

        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper {
            width: 5px;
            right: 0;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper.scrollable .scroll-pane,
        .chat-size-0 .yk-chat-plus .scroll-wrapper.scrollable .scroll-pane {
            padding-right: 8px;
        }
        .chat-size-0 .yk-chat-plus .scroll-pane {
            line-height: 0.8rem;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track .handle,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track .handle {
            background: wheat!important;
            border-radius: 4px!important;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track .handle,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track .handle,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-up,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-down,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track {
            width: 100%!important;
        }
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-up,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .arrow-down {
            background: unset;
            color: wheat!important;
            font-weight: bold;
            margin-left: -3px;
            font-size: 10px;
            height: 10px;
            left: 0;
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
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track .handle,
        .chat-size-0 .yk-chat-plus .scroll-wrapper .scrollbar-wrapper .track .handle {
            background: none;
            border-image: none;
            border-color: transparent;
        }

        /* Background */
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="0"]:hover:not(:has(.increase-opacity:hover)) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="0"]:has(.magic-input:active) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="0"]:has(.magic-input:focus) .border-image {
            opacity: 0.6!important;
        }
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="1"]:hover:not(:has(.increase-opacity:hover)) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="1"]:has(.magic-input:active) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="1"]:has(.magic-input:focus) .border-image {
            opacity: 0.8!important;
        }
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="2"]:hover:not(:has(.increase-opacity:hover)) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="2"]:has(.magic-input:active) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="2"]:has(.magic-input:focus) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="3"]:hover:not(:has(.increase-opacity:hover)) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="3"]:has(.magic-input:active) .border-image,
        .chat-size-0 .yk-chat-plus.border-window.transparent[data-opacity-lvl="3"]:has(.magic-input:focus) .border-image {
            opacity: 1!important;
        }

        /* Other */
        .chat-size-0 .yk-chat-plus,
        .chat-size-0 .yk-chat-plus .chat-message-wrapper,
        .chat-size-0 .yk-chat-plus .chat-channel-card-wrapper,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .magic-input-wrapper,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .magic-input-wrapper .magic-input,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .control-wrapper .menu-card,
        .chat-size-0 .yk-chat-plus .chat-input-wrapper .control-wrapper .chat-config-wrapper
        {
            background: unset;
            border: unset;
            box-shadow: unset;
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
        handleChatToggle(wnd);
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

                wnd.querySelector('magic_input').addEventListener('blur', function() {
                    setTimeout(()=>{
                        isTyping = false;
                        $(this).blur();
                    }, 0);
                });

                setTimeout(()=>{
                    chatToggle(wnd);
                    document.querySelector('.left-column.main-column').style.zIndex = "0";
                }, 0);
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
        const relativeDiv = document.createElement('div');

        const increaseOpacityBtn = document.createElement('div');
        increaseOpacityBtn.className = 'increase-opacity';
        Object.assign(increaseOpacityBtn.style, {
            top: '6px',
            left: 'auto',
            right: '0',
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
     * Handles chat toggling.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function handleChatToggle(wnd) {
        intercept(Engine.chatController.getChatWindow(), 'chatToggle', () => {
            chatToggle(wnd);
        });
    }

    /**
     * Toggles chat.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function chatToggle(wnd) {
        if (document.querySelector('.game-window-positioner').classList.contains('chat-size-0')) {
            enabled = true;
            wnd.classList.add("border-window", "transparent", "yk-chat-plus");
        } else {
            enabled = false;
            wnd.classList.remove("border-window", "transparent", "yk-chat-plus");
        }
        alignMessageInput(wnd);
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

            const excluded = ["chat-channel-card", "chat-channel-card-icon", "magic-input", "card-name", "card-remove", "link", "chat-config-wrapper-button", "increase-opacity", "click-able"];
            if (excluded.some(className => e.target.classList.contains(className))) {
                return;
            }

            triggerGameCanvasClick(e, wnd);
        });
    }

    /**
     * Propagates the click ivent to game canvas.
     * @param {Event} e - Initial click event.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function triggerGameCanvasClick(e, wnd) {
        if (!Engine?.interface?.get$GAME_CANVAS) {
            return;
        }
        const canvas = Engine.interface.get$GAME_CANVAS()[0];
        const canvasRect = canvas.getBoundingClientRect();

        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top + canvasRect.y;

        const canvasClickEvent = new MouseEvent('click', {
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
        const menuCard = wnd.querySelector('.chat-input-wrapper .menu-card');
        const listCard = wnd.querySelector('.chat-input-wrapper .card-list');
        const minWindowWidth = 1625;
        let smallBattleScreen = (inBattle && minWindowWidth > window.innerWidth);
        if (wnd.classList.contains("yk-chat-plus") && !smallBattleScreen) {
            const buttonOffset = (parseInt(document.querySelector('.bottom-left-additional')?.lastChild?.style?.left) || 0);
            magicInputWrapper.style.marginLeft = `${buttonOffset + 98}px`;
            menuCard.style.marginLeft = `${buttonOffset + 64}px`;
            listCard.style.marginLeft = `${buttonOffset + 64}px`;
        } else {
            magicInputWrapper.style.marginLeft = '';
            menuCard.style.marginLeft = '';
            listCard.style.marginLeft = '';
        }

        wnd.style.paddingBottom = smallBattleScreen ? (wnd.style.bottom ?? '') : '';
        wnd.style.height = smallBattleScreen ? '260px' : '';
        wnd.style.width = smallBattleScreen ? '410px' : '';

        $(".scroll-wrapper", $(wnd)).trigger("update");
    }

    /**
     * Handles message input alignment.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function handleMessageInputAlignment(wnd) {
        const bottomLeftBtnWrapper = document.querySelector('.bottom-left-additional');
        if (!bottomLeftBtnWrapper) return;

        const observer = new MutationObserver((mutations) => {
            alignMessageInput(wnd);
        });

        observer.observe(bottomLeftBtnWrapper, { childList: true });
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
                alignMessageInput(wnd);
            }
        }

        watchBattlePropertyChanges(battle, "show", onBattleChange);
    }

    // Start the script
    waitForChatWindow();
})();
