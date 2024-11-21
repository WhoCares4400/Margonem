// ==UserScript==
// @name         Quest Window+ (QuestW+) [NI]
// @namespace    http://tampermonkey.net/
// @version      1.1
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
            padding-bottom: 8px;
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
        .yuuki-qw-plus .quest-log .end-line {
            background: url(../img/gui/buttony.png?v=1732022921596) -428px -494px;
            width: 213px;
            height: 1px;
            margin-top: 2px;
            margin-left: auto;
            margin-right: auto;
        }

        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper {
            display: flex;
            flex-wrap: wrap;
            width: 38px;
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
        .yuuki-qw-plus .quest-box .info-wrapper .quest-buttons .quest-buttons-wrapper .button > *:not(.add-bck),
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


        .yuuki-qw-plus-dis .quest-log .end-line,
        .yuuki-qw-plus-dis .border-image,
        .yuuki-qw-plus-dis .increase-opacity,
        .yuuki-qw-plus-dis .toggle-size-button,
        .yuuki-qw-plus-dis .quests-info-wrapper,
        .yuuki-qw-plus-dis .hide-collapsed-quests-wrapper,
        .yuuki-qw-plus-dis .additional-btns-wrapper {
            display: none !important;
        }

        .yuuki-qw-plus-dis .enable-yuuki-q-btn {
            display: inline-block;
        }
        .yuuki-qw-plus .enable-yuuki-q-btn {
            display: none;
        }
        `;
    GM_addStyle(STYLE_CONTENT);

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
        const wnd = Engine.quests.wnd.$[0];
        if (!wnd) return;

        customizeWindowAppearance(wnd);
        customizeWindowSize(wnd);
        addEndLines(wnd);
        initializeQuestOrder(wnd);
        initializeHideCollapsedQuests(wnd);
        prependAdditionalButtons(wnd);
        addInfoContainer(wnd);
        monitorScrollPane(wnd);

        // Apply main class to the window based on stored settings
        const isEnabled = Boolean(parseInt(localStorage.getItem('yuukiQuestsEnabled'), 10));
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

        const opacityLevel = parseInt(localStorage.getItem('questOpacityLvl'), 10);
        wnd.setAttribute('data-opacity-lvl', isNaN(opacityLevel) ? '3' : opacityLevel.toString());

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
            localStorage.setItem('questOpacityLvl', newOpacity.toString());
        });
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

        const storedHeight = parseInt(localStorage.getItem('questWindowHeight'), 10);
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
            localStorage.setItem('questWindowHeight', currentHeight.toString());
        });
        wnd.appendChild(toggleSizeBtn);
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
        const savedOrder = localStorage.getItem('questOrder');
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
     * Saves the current order of quests to localStorage.
     * @param {HTMLElement} questWrapper - The quest wrapper element.
     */
    function saveQuestOrder(questWrapper) {
        const order = Array.from(questWrapper.children)
            .filter((child) => !child.classList.contains('middle-graphics'))
            .map((child) => child.className.split(' ')[1]);
        localStorage.setItem('questOrder', JSON.stringify(order));
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
            if (event.target.classList.contains('add-bck')) {
                setTimeout(() => {
                    const questBox = event.target.closest('.quest-box');
                    if (questBox) {
                        const isChecked = hideCollapsedCheckbox.querySelector('input').checked;
                        if (event.target.classList.contains('show')) {
                            questBox.classList.toggle('quest-hidden', isChecked);
                            Engine?.quests?.updateScroll();
                        }
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
        Object.assign(containerDiv.style, {
            display: 'flex',
            position: 'absolute',
            top: '2px',
            left: '40px',
            color: '#e1e1e1',
            fontSize: '11px',
            alignContent: 'center',
        });

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'hide-collapsed-quests';
        checkbox.checked = Boolean(parseInt(localStorage.getItem('questCollapsedHide'), 10));
        checkbox.style.zIndex = '1';

        // Update quest visibility based on checkbox state
        const updateQuestVisibility = () => {
            const hideQuestBoxes = wnd.querySelectorAll('.quest-box .add-bck.show');
            hideQuestBoxes.forEach((btn) => {
                const questBox = btn.closest('.quest-box');
                questBox?.classList.toggle('quest-hidden', checkbox.checked);
            });
            Engine?.quests?.updateScroll();
            localStorage.setItem('questCollapsedHide', checkbox.checked ? '1' : '0');
        };

        updateQuestVisibility();

        const label = document.createElement('label');
        label.setAttribute('for', 'hide-collapsed-quests');
        Object.assign(label.style, {
            lineHeight: '1',
            zIndex: '1',
            textAlign: 'left',
        });
        label.innerHTML = 'Ukryj<br>zwinięte';

        checkbox.addEventListener('change', updateQuestVisibility);

        containerDiv.appendChild(checkbox);
        containerDiv.appendChild(label);

        return containerDiv;
    }

    /**
     * Adds additional buttons to the quest window.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function prependAdditionalButtons(wnd) {
        const scrollPane = wnd.querySelector('.scroll-pane');
        const header = wnd.querySelector('.header-label-positioner');
        if (!scrollPane || !header) return;

        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'additional-btns-wrapper';
        wrapperDiv.style.textAlign = 'center';

        // Expand/Collapse All Button
        const toggleAllBtn = createButton(
            'button small green collapse-toggle-btn',
            'Rozwiń / Zwiń wszystkie',
            function () {
                const isExpanded = this.getAttribute('data-state') === 'true';
                this.setAttribute('data-state', String(!isExpanded));

                const targets = scrollPane.querySelectorAll(`.add-bck.${isExpanded ? 'show' : 'hide'}`);
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
                localStorage.setItem('yuukiQuestsEnabled', '0');
            }
        );
        disableBtn.style.marginLeft = '2px';
        wrapperDiv.appendChild(disableBtn);

        scrollPane.insertBefore(wrapperDiv, scrollPane.firstChild);

        // Enable Enhancement Button
        const enableBtn = createButton(
            'button small green enable-yuuki-q-btn',
            'QuestW+',
            function () {
                wnd.classList.remove('yuuki-qw-plus-dis');
                wnd.classList.add('yuuki-qw-plus', 'transparent');
                const storedHeight = parseInt(localStorage.getItem('questWindowHeight'), 10) || 40;
                wnd.querySelector('.quest-log')?.style.setProperty('height', `${storedHeight}vh`);
                Engine?.quests?.updateScroll();
                localStorage.setItem('yuukiQuestsEnabled', '1');
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
     * Adds an info container displaying quest counts.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function addInfoContainer(wnd) {
        const scrollPane = wnd.querySelector('.scroll-pane');
        const header = wnd.querySelector('.header-label-positioner');
        if (!scrollPane || !header) return;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'quests-info-wrapper';
        Object.assign(infoDiv.style, {
            position: 'absolute',
            top: '2px',
            right: '24px',
            color: '#e1e1e1',
            fontSize: '11px',
            alignContent: 'center',
            lineHeight: '1',
            zIndex: '1',
        });

        infoDiv.innerHTML = `
            Wszystkich: <span id="all-quest-count">0</span><br>
            Zwiniętych: <span id="collapsed-quest-count">0</span>
        `;
        header.prepend(infoDiv);

        refreshInfoCounts(wnd);
    }

    /**
     * Refreshes the quest counts displayed in the info container.
     * @param {HTMLElement} wnd - The quest window element.
     */
    function refreshInfoCounts(wnd) {
        const scrollPane = wnd.querySelector('.scroll-pane');
        if (!scrollPane) return;

        const allQuestCount = scrollPane.querySelectorAll('.quest-box').length;
        const collapsedQuestCount = scrollPane.querySelectorAll('.add-bck.show').length;

        document.getElementById('all-quest-count').innerText = allQuestCount.toString();
        document.getElementById('collapsed-quest-count').innerText = collapsedQuestCount.toString();
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
                scrollPane.scrollTop = parseFloat(localStorage.getItem('questScrollPosition')) || 0;
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

        scrollPane.scrollTop = parseFloat(localStorage.getItem('questScrollPosition')) || 0;
        scrollPane.addEventListener('scroll', () => {
            localStorage.setItem('questScrollPosition', scrollPane.scrollTop.toString());
        });
    }

    // Start the script
    waitForQuestWindow();
})();
