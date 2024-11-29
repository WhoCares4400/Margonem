// ==UserScript==
// @name         SeeThroughEq [NI]
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Ukrywa część prawej kolumny zwiększając widoczność
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
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        .interface-layer.yk-see-through-eq .game-layer {
            right: 0 !important;
        }
        .interface-layer.yk-see-through-eq .right-column {
            background: none !important;
            pointer-events: none;
        }
        .interface-layer.yk-see-through-eq .right-column > .border {
            display: none !important;
        }
        .interface-layer.yk-see-through-eq .right-column .extended-stats,
        .interface-layer.yk-see-through-eq .right-column .inner-wrapper > * > * {
            pointer-events: auto;
        }
    `);

    const interval = setInterval(() => {
        if (typeof Engine !== 'undefined' && Engine?.interface?.get$interfaceLayer && Engine?.allInit) {
            clearInterval(interval);
            Engine.interface.get$interfaceLayer()?.addClass("yk-see-through-eq");
            setTimeout(()=>{Engine.interface?.setSizeEqColumnSize();},1);
        }
    }, 100);
})();
