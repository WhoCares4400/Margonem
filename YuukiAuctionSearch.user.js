// ==UserScript==
// @name         Auction Search [NI]
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Wyszukiwanie itema na Aukcji (Nowy Interfejs)
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
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    if (getCookie('interface') === 'ni') {
        let initInterval = setInterval(() => {
            if (Engine?.interface?.showPopupMenu) {
                clearInterval(initInterval);

                const originalShowPopupMenu = Engine.interface.showPopupMenu;
                Engine.interface.showPopupMenu = function (menu, e, onMap) {
                    //const itemId = e.target.className.match(/item-id-(\d+)/)?.[1];
                    if (Engine.auctions) {
                        const auc = Engine.auctions;
                        menu.splice(Math.floor(menu.length / 2), 0, ["Wyszukaj na aukcji", () => {
                            const nameInput = auc.getAuctionWindow().getContent().find('.name-item-input input');

                            auc.getAuctionCards().clickCard(0, null),
                                auc.getAuctionItemCategory().clearItemCategory(),
                                auc.setActualKindOfAuction(4);

                            nameInput.next().css({visibility: 'visible'});
                            nameInput.val(e.target.dataset.name).trigger('focusout');
                        }]);
                    }
                    originalShowPopupMenu.call(this, menu, e, onMap);
                }
            }
        }, 100);
    }
})();