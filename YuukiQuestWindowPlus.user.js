// ==UserScript==
// @name         Quest Window+ (QuestW+) [NI]
// @namespace    http://tampermonkey.net/
// @version      1.7.1
// @description  Odświeżone okno z questami
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
// ==/UserScript==

(function () {
    'use strict';

    const STYLE_CONTENT = `
        .yuuki-qw-plus {
            border-width: 2px !important;
            width: 245px !important;
        }
        .yuuki-qw-plus .quest-log {
            width: 100%;
            padding-bottom: 2px;
        }

        .yuuki-qw-plus .header-label-positioner {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
        }
        .yuuki-qw-plus .close-button-corner-decor {
            top: 0 !important;
            right: 0 !important;
            margin: 3px !important;
        }
        .yuuki-qw-plus .content {
            padding-bottom: 0 !important;
        }

        .yuuki-qw-plus .quest-log .scroll-wrapper .scroll-pane .middle-graphics,
        .yuuki-qw-plus .quest-log .scroll-wrapper .scroll-pane .quest-hidden {
            display: none !important;
        }
        .yuuki-qw-plus .quest-log .quest-box .quest-content,
        .yuuki-qw-plus .quest-log .quest-box .info-wrapper,
        .yuuki-qw-plus .quest-log .quest-search,
        .yuuki-qw-plus .quest-log .scroll-wrapper .scrollbar-wrapper .track .handle,
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .track .handle {
            background: none;
            border-image: none;
            border-color: transparent;
        }

        .yuuki-qw-plus.transparent .quest-log .scroll-wrapper .scrollbar-wrapper {
            width: 5px;
            right: 0;
        }
        .yuuki-qw-plus.transparent .quest-log  .scroll-wrapper.classic-bar.scrollable .scroll-pane,
        .yuuki-qw-plus.transparent .quest-log  .scroll-wrapper.scrollable .scroll-pane {
            padding-right: 12px;
        }
        .yuuki-qw-plus.transparent .quest-log .scroll-pane {
            line-height: 0.8rem;
        }
        .yuuki-qw-plus .quest-log .scroll-wrapper .scrollbar-wrapper .track .handle,
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .track .handle {
            background: wheat;
            border-radius: 4px;
        }
        .yuuki-qw-plus .quest-log .scroll-wrapper .scrollbar-wrapper .track .handle,
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .track .handle,
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .arrow-up,
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .arrow-down,
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .track {
            width: 100%;
        }
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .arrow-up,
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .arrow-down {
            background: unset;
            color: wheat;
            font-weight: bold;
            margin-left: -3px;
            font-size: 10px;
            height: 10px;
            left: 0;
            transform: rotate(-90deg);
        }
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .arrow-up::before {
            content: ">";
        }
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .arrow-down::before {
            content: "<";
        }
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .track {
            top: 8px;
            left: 1px;
            bottom: 9px;
        }
        .yuuki-qw-plus .quest-log .scroll-wrapper.classic-bar .scrollbar-wrapper .background {
            left: -1px;
        }

        .yuuki-qw-plus:not([data-opacity-lvl="0"]) .quest-log .quest-box .info-wrapper {
            background: linear-gradient(0deg, rgb(0 0 0 / 10%) 0%, rgb(0 0 0 / 25%) 100%);
            box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 4px, rgba(0, 0, 0, 0.23) 0px 3px 4px;
            cursor: move;
        }
        .yuuki-qw-plus .quest-log .quest-box .info-wrapper .quest-title {
            color: #fff;
            font-size: 11px;
        }
        .yuuki-qw-plus .quest-log .quest-box .quest-content {
            padding-top: 3px;
            padding-bottom: 3px;
        }
        .yuuki-qw-plus .quest-log .quest-box .quest-content span {
            color: wheat;
            font-size: 11px;
            padding: 0;
            padding-left: 10px;
        }
        .yuuki-qw-plus .quest-log .quest-box .quest-content .q_kill span {
            color: #f16462;
            display: inline;
        }
        .yuuki-qw-plus .quest-log .quest-box .quest-content .q_bring span {
            color: #3cd9ed;
            display: inline;
        }

        .yuuki-qw-plus .quest-log .quest-search {
            position: relative;
            left: 0;
            border: none;
        }

        .yuuki-qw-plus.transparent .quest-log .scroll-wrapper {
            position: relative;
            height: calc(100% - 29px);
            top: 0;
            left: 0;
            right: 0;
            border: none;
        }
        .yuuki-qw-plus .end-line {
            background-image: linear-gradient(90deg,transparent 10%,rgba(255,255,255,.8),transparent 90%);
            width: 213px;
            height: 1px;
            margin-top: 2px;
            margin-left: auto;
            margin-right: auto;
        }

        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper {
            display: flex;
            flex-wrap: wrap;
            height: 27px;
            width: 38px;
            margin-top: -3px;
            transform: scale(0.8);
        }
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button {
            height: 16px;
            width: 16px;
            margin: 0;
            margin-left: 2px;
            border-radius: 4px;
            background: unset;
            border: unset;
            box-shadow: unset;
        }
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button.track.green,
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button.observe.green {
            background: #6d562b;
            outline: 1px solid #c9ae7c;
        }
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button .add-bck {
            height: 16px;
            width: 16px;
            top: 0;
            left: 0;
        }
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button > *:not(.add-bck):not(svg),
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button::before {
            display: none;
        }
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button.remove,
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button.track {
            margin-bottom: 2px;
        }
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button .add-bck.delete {
            margin-top: 1px;
            margin-left: -2px;
        }
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button .add-bck.tracking {
            margin-top: 1px;
            margin-left: -2px;
        }
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button .add-bck.observed {
            margin-top: 1px;
        }
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button .add-bck.hide,
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button .add-bck.show {
            margin-top: 2px;
        }

        .yuuki-qw-plus .quests-info-wrapper {
            color: #e1e1e1;
            font-size: 11px;
            align-content: center;
            text-align: center;
            line-height: 1;
            z-index: 1;
        }
        .yuuki-qw-plus .quests-info-wrapper .quest-count {
            font-weight: bold;
            margin-right: 2px;
        }
        .yuuki-qw-plus .hide-collapsed-quests-wrapper {
            display: flex;
            position: absolute;
            top: 2px;
            right: 24px;
            color: #e1e1e1;
            font-size: 11px;
            align-content: center;
        }
        .yuuki-qw-plus select {
            cursor: url(/img/gui/cursor/1n.png?v=1728634377350), url(/img/gui/cursor/1n.cur?v=1728634377350), auto !important;
            flex-shrink: 0;
        }
        .yuuki-qw-plus input,
        .yuuki-qw-plus select {
            border-radius: 5px;
            background: #3b3b3b;
            color: wheat;
        }

        .yuuki-qw-plus-dis .end-line,
        .yuuki-qw-plus-dis .border-image,
        .yuuki-qw-plus-dis .increase-opacity,
        .yuuki-qw-plus-dis .toggle-size-button,
        .yuuki-qw-plus-dis .quests-info-wrapper,
        .yuuki-qw-plus-dis .hide-collapsed-quests-wrapper,
        .yuuki-qw-plus-dis .additional-btns-wrapper {
            display: none !important;
        }

        .yuuki-qw-plus-dis .enable-yuuki-q-btn,
        .yuuki-qw-plus .quest-box.yk-tracked-quest .quest-buttons-wrapper .button.yk-track-btn {
            display: inline-block !important;
        }
        .yuuki-qw-plus .enable-yuuki-q-btn,
        .yuuki-qw-plus .interface-element-header-1-background-stretch,
        .yuuki-qw-plus .quest-box.yk-tracked-quest .quest-buttons-wrapper .button.remove {
            display: none !important;
        }
        `;
    GM_addStyle(STYLE_CONTENT);

    const intercept = (obj, key, cb, _ = obj[key]) => obj[key] = (...args) => {
        const result = _.apply(obj, args);
        return cb(...args) ?? result;
    };

    /**
     * Waits for the quest window to be ready and initializes it.
     */
    function waitForQuestWindow() {
        const interval = setInterval(() => {
            if (Engine?.quests?.wnd?.$) {
                clearInterval(interval);
                initializeQuestWindow();
            }
        }, 100);
    }

    /**
     * Initializes the quest window modifications.
     */
    function initializeQuestWindow() {
        const wnd = Engine?.quests?.wnd?.$[0];
        if (!wnd) return;

        customizeWindowAppearance(wnd);
        customizeWindowSize(wnd);
        openSettings(wnd);
        addEndLines(wnd);
        initializeQuestOrder(wnd);
        addInfoContainer(wnd);
        initializeHideCollapsedQuests(wnd);
        prependAdditionalButtons(wnd);
        createTrackingShortcutInput(wnd);
        handleTrackingChange(wnd);
        monitorScrollPane(wnd);

        // Apply main class to the window based on stored settings
        const isEnabled = Boolean(parseInt(GM_getValue('yk-yuukiQuestsEnabled', '1'), 10));
        if (isEnabled) {
            wnd.classList.add('yuuki-qw-plus');
        } else {
            wnd.querySelector('.disable-yuuki-q-btn')?.click();
        }

        // Attach scroll event
        handleQuestScroll(wnd);
    }

    /**
     * Customizes the appearance of the quest window.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function customizeWindowAppearance(wnd) {
        if (Engine?.quests?.wnd?.setTransparentWindow) {
            Engine.quests.wnd.setTransparentWindow();
        }

        wnd.querySelector('.border-image')?.style.setProperty('margin', '0');

        const opacityLevel = parseInt(GM_getValue('yk-questOpacityLvl', '3'), 10);
        wnd.setAttribute('data-opacity-lvl', opacityLevel.toString());

        // Create opacity control button
        const increaseOpacityBtn = document.createElement('div');
        increaseOpacityBtn.className = 'increase-opacity';
        Object.assign(increaseOpacityBtn.style, {
            top: '0',
            left: '0',
            margin: '5px',
            position: 'absolute',
        });
        increaseOpacityBtn.addEventListener('click', () => {
            let opacity = parseInt(wnd.getAttribute('data-opacity-lvl'), 10);
            opacity = isNaN(opacity) ? 0 : opacity;
            const newOpacity = (opacity + 1) % 6;
            wnd.setAttribute('data-opacity-lvl', newOpacity.toString());
            GM_setValue('yk-questOpacityLvl', newOpacity.toString());
        });
        $(increaseOpacityBtn).tip("Zmień przezroczystość okienka");
        wnd.appendChild(increaseOpacityBtn);
    }

    /**
     * Adds functionality to resize the quest window.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function customizeWindowSize(wnd) {
        const HEIGHT_INCREMENT = 5;
        const MAX_HEIGHT = 75;
        const MIN_HEIGHT = 15;
        const DEFAULT_HEIGHT = 40;

        const questLog = wnd.querySelector('.quest-log');
        if (!questLog) return;

        const storedHeight = parseInt(GM_getValue('yk-questWindowHeight', DEFAULT_HEIGHT.toString()), 10);
        const initialHeight = isNaN(storedHeight) ? DEFAULT_HEIGHT : storedHeight;
        questLog.style.height = `${initialHeight}vh`;

        const toggleSizeBtn = document.createElement('div');
        toggleSizeBtn.className = 'toggle-size-button';
        Object.assign(toggleSizeBtn.style, {
            top: '0',
            left: '20px',
            margin: '5px',
            position: 'absolute',
        });
        toggleSizeBtn.addEventListener('click', () => {
            let currentHeight = parseInt(questLog.style.height, 10) || DEFAULT_HEIGHT;
            currentHeight = currentHeight >= MAX_HEIGHT ? MIN_HEIGHT : currentHeight + HEIGHT_INCREMENT;
            questLog.style.height = `${currentHeight}vh`;
            Engine?.quests?.updateScroll();
            GM_setValue('yk-questWindowHeight', currentHeight.toString());
        });
        $(toggleSizeBtn).tip("Zmień rozmiar okienka");
        wnd.appendChild(toggleSizeBtn);
    }

    /**
     * Oopens settings window with buttons.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function openSettings(wnd) {
        const settingsBtn = document.createElement('div');
        settingsBtn.className = 'settings-button';
        Object.assign(settingsBtn.style, {
            top: '0',
            left: '38px',
            margin: '5px',
            position: 'absolute',
        });
        settingsBtn.addEventListener('click', () => {
            const btnsWrapper = wnd.querySelector('.additional-btns-wrapper');
            let isHidden = window.getComputedStyle(btnsWrapper).display === 'none';
            btnsWrapper.style.display = isHidden ? "block" : "none";
            GM_setValue('yk-questOptVisible', isHidden ? '1' : '0');
        });
        $(settingsBtn).tip("Pokaż/Ukryj przyciski");
        wnd.appendChild(settingsBtn);
    }

    /**
     * Adds decorative end lines to each quest box.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function addEndLines(wnd) {
        wnd.querySelectorAll('.quest-box').forEach((questBox) => {
            if (!questBox.querySelector('.end-line')) {
                const endLine = document.createElement('div');
                endLine.className = 'end-line';
                questBox.prepend(endLine);
            }
        });
    }

    /**
     * Initializes the quest order functionality using Sortable.js.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function initializeQuestOrder(wnd) {
        const questWrapper = wnd.querySelector('.scroll-pane');
        if (!questWrapper) return;

        // Apply saved quest order
        const savedOrder = GM_getValue('yk-questOrder');
        if (savedOrder) {
            try {
                const order = JSON.parse(savedOrder);
                order.forEach((questClass) => {
                    const element = questWrapper.querySelector(`.${questClass}`);
                    if (element && !element.classList.contains('middle-graphics')) {
                        questWrapper.appendChild(element);
                    }
                });
            } catch (error) {
                console.error('Error parsing quest order:', error);
            }
        }

        // Initialize Sortable.js
        new Sortable(questWrapper, {
            handle: '.info-wrapper',
            animation: 150,
            ghostClass: 'sortable-ghost',
            filter: '.middle-graphics',
            onEnd: () => saveQuestOrder(questWrapper),
        });
    }

    /**
     * Saves the current order of quests to storage.
     * @param {HTMLElement} questWrapper - The quest wrapper element.
     */
    function saveQuestOrder(questWrapper) {
        const order = Array.from(questWrapper.children)
            .filter((child) => !child.classList.contains('middle-graphics'))
            .map((child) => child.className.split(' ')[1]);
        GM_setValue('yk-questOrder', JSON.stringify(order));
    }

    /**
     * Adds functionality to hide collapsed quests.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function initializeHideCollapsedQuests(wnd) {
        const scrollPane = wnd.querySelector('.scroll-pane');
        if (!scrollPane) return;

        const hideCollapsedCheckbox = createHideCollapsedCheckbox(wnd);
        const header = wnd.querySelector('.header-label-positioner');
        if (header && hideCollapsedCheckbox) {
            header.prepend(hideCollapsedCheckbox);
        }

        scrollPane.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-bck') && (event.target.classList.contains('show') || event.target.classList.contains('hide'))) {
                const questBox = event.target.closest('.quest-box');
                setTimeout(() => {
                    if (questBox) {
                        const isChecked = hideCollapsedCheckbox.querySelector('input').checked;
                        questBox.classList.toggle('quest-hidden', isChecked);
                        Engine?.quests?.updateScroll();
                        refreshInfoCounts(wnd);
                    }
                }, 0);
            }
        });
    }

    /**
     * Creates a checkbox to hide or show collapsed quests.
     * @param {HTMLElement} wnd - The quest window element.
     * @returns {HTMLElement} The container div containing the checkbox and label.
     */
    function createHideCollapsedCheckbox(wnd) {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'hide-collapsed-quests-wrapper';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'hide-collapsed-quests';
        checkbox.checked = Boolean(parseInt(GM_getValue('yk-questCollapsedHide', '0'), 10));
        checkbox.style.cursor = 'pointer';
        checkbox.style.zIndex = '1';

        // Update quest visibility based on checkbox state
        const updateQuestVisibility = () => {
            const hideQuestBoxes = wnd.querySelectorAll('.quest-box .add-bck.show');
            hideQuestBoxes.forEach((btn) => {
                const questBox = btn.closest('.quest-box');
                questBox?.classList.toggle('quest-hidden', checkbox.checked);
            });
            refreshInfoCounts(wnd);
            Engine?.quests?.updateScroll();
            GM_setValue('yk-questCollapsedHide', checkbox.checked ? '1' : '0');
        };

        updateQuestVisibility();

        const label = document.createElement('label');
        label.setAttribute('for', 'hide-collapsed-quests');
        Object.assign(label.style, {
            textAlign: 'left',
            lineHeight: '1',
            cursor: 'pointer',
            zIndex: '1',
        });
        label.innerHTML = 'Ukryj<br>zwinięte';

        checkbox.addEventListener('change', updateQuestVisibility);

        containerDiv.appendChild(checkbox);
        containerDiv.appendChild(label);

        return containerDiv;
    }

    /**
     * Adds quest tracking shortcut selection.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function createTrackingShortcutInput(wnd) {
        const wrapperDiv = wnd.querySelector('.additional-btns-wrapper');
        const container = document.createElement('div');
        container.style.paddingBottom = '0.25rem';

        // Create Label
        const label = document.createElement('label');
        label.htmlFor = 'qw-navigation-shortcut';
        label.style.color = "wheat";
        label.textContent = 'Skrót klawiszowy nawigacji:';

        // Create Text Input
        const shortcutInput = document.createElement('input');
        shortcutInput.type = 'text';
        shortcutInput.id = 'qw-navigation-shortcut';
        shortcutInput.readOnly = true;
        shortcutInput.style.color = "wheat";
        shortcutInput.style.textAlign = "center";

        let currentShortcut = GM_getValue('yk-questTrackingShortcut', '');
        let currentListener = null;

        function setShortcutListener(shortcut) {
            if (currentListener) {
                window.removeEventListener('keydown', currentListener);
            }

            if (shortcut) {
                currentShortcut = shortcut;
                currentListener = (event) => {
                    const activeKeys = [];
                    if (event.ctrlKey) activeKeys.push('CTRL');
                    if (event.shiftKey) activeKeys.push('SHIFT');
                    if (event.altKey) activeKeys.push('ALT');
                    const eventKey = event.key.toUpperCase();
                    if (!['CONTROL', 'SHIFT', 'ALT'].includes(eventKey)) {
                        activeKeys.push(eventKey);
                    }

                    if (activeKeys.join(' + ') === currentShortcut) {
                        goToTrackingTarget();
                    }
                };
                window.addEventListener('keydown', currentListener);
            }
        }

        shortcutInput.addEventListener('keyup', (e) => {
            if (e.key === 'Escape' || e.key === 'Backspace') {
                shortcutInput.value = "";
                GM_setValue('yk-questTrackingShortcut', '');
                setShortcutListener('');
                return;
            }

            const keys = [];
            if (e.ctrlKey) keys.push('CTRL');
            if (e.shiftKey) keys.push('SHIFT');
            if (e.altKey) keys.push('ALT');

            let detectedKey = e.key.toUpperCase();
            if (!['CONTROL', 'SHIFT', 'ALT'].includes(detectedKey)) {
                keys.push(detectedKey);
            }

            if (keys.length === 0 || (keys.length === 1 && ['CONTROL', 'SHIFT', 'ALT'].includes(keys[0]))) return;

            const newShortcut = keys.join(' + ');
            shortcutInput.value = newShortcut;
            GM_setValue('yk-questTrackingShortcut', newShortcut);
            setShortcutListener(newShortcut);
        });

        shortcutInput.value = currentShortcut;
        setShortcutListener(currentShortcut);

        container.append(label);
        container.append(shortcutInput);
        wrapperDiv.prepend(container);
    }

    /**
     * Adds additional buttons to the quest window.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function prependAdditionalButtons(wnd) {
        const header = wnd.querySelector('.header-label-positioner');
        const innerContent = wnd.querySelector('.inner-content');
        if (!header || !innerContent) return;

        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'additional-btns-wrapper';
        wrapperDiv.style.display = Boolean(parseInt(GM_getValue('yk-questOptVisible', '1'), 10)) ? 'block' : 'none';
        wrapperDiv.style.textAlign = 'center';
        wrapperDiv.style.paddingTop = '5px';
        wrapperDiv.style.paddingBottom = '2px';

        // Expand/Collapse All Button
        const toggleAllBtn = createButton(
            'button small green collapse-toggle-btn',
            'Rozwiń / Zwiń wszystkie',
            function () {
                const isExpanded = this.getAttribute('data-state') === 'true';
                this.setAttribute('data-state', String(!isExpanded));

                const targets = innerContent.querySelectorAll(`.add-bck.${isExpanded ? 'show' : 'hide'}`);
                targets.forEach((target) => {
                    const questBox = target.closest('.quest-box');
                    questBox?.classList.remove('quest-hidden');
                    target.click();
                });
                refreshInfoCounts(wnd);
            }
        );
        toggleAllBtn.setAttribute('data-state', 'false');
        wrapperDiv.appendChild(toggleAllBtn);

        // Disable Enhancement Button
        const disableBtn = createButton(
            'button small disable-yuuki-q-btn',
            'Wyłącz',
            function () {
                wnd.classList.remove('yuuki-qw-plus', 'transparent');
                wnd.classList.add('yuuki-qw-plus-dis');
                wnd.querySelector('.quest-log')?.style.setProperty('height', '60vh');
                Engine?.quests?.updateScroll();
                GM_setValue('yk-yuukiQuestsEnabled', '0');
            }
        );
        disableBtn.style.marginLeft = '2px';
        wrapperDiv.appendChild(disableBtn);

        innerContent.insertBefore(wrapperDiv, innerContent.firstChild);

        // Enable Enhancement Button
        const enableBtn = createButton(
            'button small green enable-yuuki-q-btn',
            'QuestW+',
            function () {
                wnd.classList.remove('yuuki-qw-plus-dis');
                wnd.classList.add('yuuki-qw-plus', 'transparent');
                const storedHeight = parseInt(GM_getValue('yk-questWindowHeight', '40'), 10) || 40;
                wnd.querySelector('.quest-log')?.style.setProperty('height', `${storedHeight}vh`);
                Engine?.quests?.updateScroll();
                GM_setValue('yk-yuukiQuestsEnabled', '1');
            }
        );
        Object.assign(enableBtn.style, {
            position: 'absolute',
            left: '0',
        });
        header.prepend(enableBtn);
    }

    /**
     * Creates a button element with specified parameters.
     * @param {string} className - The class name(s) for the button.
     * @param {string} labelText - The text label for the button.
     * @param {Function} onClick - The click event handler.
     * @returns {HTMLElement} The button element.
     */
    function createButton(className, labelText, onClick) {
        const button = document.createElement('div');
        button.className = className;

        const background = document.createElement('div');
        background.className = 'background';

        const label = document.createElement('div');
        label.className = 'label';
        label.style.fontSize = '11px';
        label.textContent = labelText;

        button.appendChild(background);
        button.appendChild(label);
        button.addEventListener('click', onClick);

        return button;
    }

    /**
     * Creates a tracking button.
     */
    function createTrackingButton() {
        const trackingBtn = document.createElement('div');
        trackingBtn.className = 'button small yk-track-btn';
        trackingBtn.style.cssText = `
            display: none;
            box-shadow: none;
        `;
        trackingBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#dbdbdb" style="width: 20px;margin-top: -3px;margin-left: -3px;">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                    <path d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z"
                          stroke="#dbdbdb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
                          stroke="#dbdbdb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </g>
            </svg>
        `;

        trackingBtn.addEventListener('click', goToTrackingTarget);
        $(trackingBtn).tip("Nawiguj do celu");

        return trackingBtn;
    }

    /**
     * Goes to current tracking target.
     */
    function goToTrackingTarget() {
        if (Engine.battle.isBattleShow()) return;

        const targets = Engine?.targets?.check() ?? [null];
        const position = Object.values(targets)[0]?.objParent;
        if (position) {
            Engine.hero.autoGoTo(position);
        }
    }

    /**
     * Adds an info container displaying quest counts.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function addInfoContainer(wnd) {
        const content = wnd.querySelector('.content');
        if (!content) return;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'quests-info-wrapper';
        infoDiv.innerHTML = `
            <div class="end-line" style="margin-bottom: 1px;"></div>
            Aktywne: <span class="quest-count" id="active-quest-count">0</span>
            Widoczne: <span class="quest-count" id="visible-quest-count">0</span>
            Ukończone: <span class="quest-count" id="finished-quest-count">0</span>
        `;
        content.append(infoDiv);

        refreshInfoCounts(wnd);
    }

    /**
     * Refreshes the quest counts displayed in the info container.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function refreshInfoCounts(wnd) {
        const scrollPane = wnd.querySelector('.scroll-pane');
        if (!scrollPane) return;

        const activeQuestCount = scrollPane.querySelectorAll('.quest-box').length;
        const visibleQuestCount = scrollPane.querySelectorAll('.quest-box:not(.quest-hidden)').length;
        const finishedQuestCount = Object.keys( Engine?.quests?.getFinishQuest() ?? [] ).length;

        document.getElementById('active-quest-count').innerText = activeQuestCount.toString();
        document.getElementById('visible-quest-count').innerText = visibleQuestCount.toString();
        document.getElementById('finished-quest-count').innerText = finishedQuestCount.toString();
    }

    /**
     * Monitors the scroll pane for changes and updates the UI accordingly.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function monitorScrollPane(wnd) {
        const scrollPane = wnd.querySelector('.scroll-pane');
        if (!scrollPane) return;

        const observer = new MutationObserver((mutations) => {
            let needsUpdate = false;
            const isHideCollapsed = document.getElementById('hide-collapsed-quests')?.checked;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('quest-box')) {
                            if (isHideCollapsed && node.querySelector('.add-bck.show')) {
                                node.classList.add('quest-hidden');
                            }
                            if (!node.querySelector('.end-line')) {
                                const endLine = document.createElement('div');
                                endLine.className = 'end-line';
                                node.prepend(endLine);
                            }
                        }
                    });
                    needsUpdate = true;
                }
            });

            if (needsUpdate) {
                scrollPane.scrollTop = parseFloat(GM_getValue('yk-questScrollPosition', '0')) || 0;
                Engine?.quests?.updateScroll();
                refreshInfoCounts(wnd);
            }
        });

        observer.observe(scrollPane, { childList: true });
    }

    /**
     * Handles scroll events on the quest pane and saves the scroll position.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function handleQuestScroll(wnd) {
        const scrollPane = wnd.querySelector('.scroll-pane');
        if (!scrollPane) return;

        scrollPane.scrollTop = parseFloat(GM_getValue('yk-questScrollPosition', '0')) || 0;
        scrollPane.addEventListener('scroll', () => {
            GM_setValue('yk-questScrollPosition', scrollPane.scrollTop.toString());
        });
    }

    /**
     * Handles changes of tracked quest.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function handleTrackingChange(wnd) {
        intercept(Engine.questTracking, 'updateData', (data) => {
            const prevTrackingQuestBox = wnd.querySelector('.quest-box.yk-tracked-quest');
            if (prevTrackingQuestBox) {
                prevTrackingQuestBox.classList.remove('yk-tracked-quest');
            }
            if (data.length > 1) {
                const questId = data[1].split('|')[0];
                setTimeout(()=>{
                    const questBox = wnd.querySelector('.quest-box.quest-'+questId);
                    questBox.classList.add('yk-tracked-quest');
                    if (!questBox.querySelector('.button.yk-track-btn')) {
                        const trackingButton = createTrackingButton();
                        const questButtonsWrapper = questBox.querySelector('.quest-buttons-wrapper');
                        questButtonsWrapper.insertBefore(trackingButton, questButtonsWrapper.firstChild);
                    }
                }, 0);
            }
        });
    }

    // Start the script
    waitForQuestWindow();
})();
