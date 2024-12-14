// ==UserScript==
// @name         AutoHeal by Yuuki [NI]
// @namespace    http://tampermonkey.net/
// @version      1.8.3
// @description  AutoHeal do Margonem (Nowy Interfejs)
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
// @grant        unsafeWindow
// ==/UserScript==

class YuukiAutoHeal {
    constructor() {
        const heroInterval = setInterval(() => {
            if (unsafeWindow?.Engine?.hero?.d?.id) {
                clearInterval(heroInterval);
                if (this.isOldInterface()) {
                    console.error("AutoHeal działa tylko na NOWYM INTERFEJSIE!");
                    return;
                }

                this.initializeProperties();
                this.createContainer();
                this.initializeAutoHealDetection();
                this.initializeHpDataCollection();
            }
        }, 250);
	}

	isOldInterface() {
		return unsafeWindow?.getCookie("interface") === 'si';
	}

	initializeProperties() {
		const self = this;

		this.version = '1.8';
		this.healInterval = 150; // ms

        this.heroId = unsafeWindow.Engine.hero.d.id;
		this.hp = null;
		this.maxhp = null;

		this.rarityDict = {
			legendary: 'L',
			upgraded: 'Ul',
			heroic: 'H',
			unique: 'U',
			common: 'P'
		};

		this.options = {
			active: Boolean(parseInt(GM_getValue(this.heroId+'ah-active', '1'))),
			shrinked: Boolean(parseInt(GM_getValue(this.heroId+'ah-shrinked', '0'))),
			hPotion: Boolean(parseInt(GM_getValue(this.heroId+'ah-hPotion', '1'))),
			hFull: Boolean(parseInt(GM_getValue(this.heroId+'ah-hFull', '0'))),
			hPercent: Boolean(parseInt(GM_getValue(this.heroId+'ah-hPercent', '0'))),
            hHealAfterDeath: Boolean(parseInt(GM_getValue(this.heroId+'ah-hHealAfterDeath', '1'))),
			hHealToFull: Boolean(parseInt(GM_getValue(this.heroId+'ah-hHealToFull', '0'))),
			hMinHealHpPercent: parseInt(GM_getValue(this.heroId+'ah-hMinHealHpPercent', '80')),
            hMinPotionHealing: parseInt(GM_getValue(this.heroId+'ah-hMinPotionHealing', '0')),
			hRarity: JSON.parse(GM_getValue(this.heroId+'ah-hRarity', '["L","Ul","H","U","P"]')),
			hNotify: Boolean(parseInt(GM_getValue(this.heroId+'ah-hNotify', '0'))),
			hHpNumDisplay: Boolean(parseInt(GM_getValue(this.heroId+'ah-hHpNumDisplay', '1'))),
            hIgnoredItems: GM_getValue(this.heroId+'ah-hIgnoredItems', ''),
		};

        this.ignoredItems = this.getIgnoredItemsArray(this.options.hIgnoredItems);
        this.Engine = unsafeWindow.getEngine();
	}

	initializeAutoHealDetection() {
        const self = this;
		//Create heal detection
        const autoHealInitializationInterval = setInterval(() => {
            if (unsafeWindow?.Engine?.battle?.hasOwnProperty('endBattle')) {
                clearInterval(autoHealInitializationInterval);

                setTimeout(() => {
                    let battle = unsafeWindow.Engine.battle;
                    function watchBattleStatePropertyChanges(obj, propertyName, callback) {
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

                    let prevState = null;
                    function onEndBattleChange(state) {
                        if (prevState !== state && state) {
                            self.autoHeal();
                        }
                        prevState = state;
                    }

                    watchBattleStatePropertyChanges(battle, "endBattle", onEndBattleChange);
                    watchBattleStatePropertyChanges(battle, "endBattleForMe", onEndBattleChange);
                }, 100);
            }
        }, 100);
	}
    initializeHpDataCollection() {
        const self = this;
        //Create HP data collection
        const hpIndicatorInitializationInterval = setInterval(() => {
            if (unsafeWindow?.Engine?.hero?.d?.warrior_stats?.hasOwnProperty('hp')) {
                clearInterval(hpIndicatorInitializationInterval);

                self.hp = unsafeWindow.Engine.hero.d.warrior_stats.hp;
                self.maxhp = unsafeWindow.Engine.hero.d.warrior_stats.maxhp;

                this.$hpPointerContainer = $(`<div class="ah-hp-number-display"${this.options.hHpNumDisplay ? '' : ' style="display: none;"'}>${self.hp} / ${self.maxhp}</div>`);
                $('.hp-indicator-wrapper-template').prepend(this.$hpPointerContainer);

                setTimeout(() => {
                    let heroData = unsafeWindow.Engine.hero.d;

                    function watchObjPropertyChanges(obj, propertyName, callback) {
                        let value = obj[propertyName];
                        Object.defineProperty(obj, propertyName, {
                            get() {
                                return value;
                            },
                            set(newValue) {
                                if (newValue !== value) {
                                    callback(newValue);
                                    value = newValue;
                                }
                            },
                            configurable: true
                        });
                    }

                    function onHpChange(hp) {
                        if (self.hp !== hp) {
                            self.hp = hp;
                            if (self.options.hHpNumDisplay) {
                                self.$hpPointerContainer.text(`${self.hp} / ${self.maxhp}`);
                            }
                        }
                    }
                    function onMaxHpChange(maxhp) {
                        if (self.maxhp !== maxhp) {
                            self.maxhp = maxhp;
                            if (self.options.hHpNumDisplay) {
                                self.$hpPointerContainer.text(`${self.hp} / ${self.maxhp}`);
                            }
                        }
                    }
                    function onWarriorStatsChange(ws) {
                        onHpChange(ws.hp);
                        onMaxHpChange(ws.maxhp);
                    }
                    function onHeroDead(isDead) {
                        if (!isDead && self.options.hHealAfterDeath) {
                            setTimeout(()=>{self.autoHeal();}, 100);
                        }
                    }

                    watchObjPropertyChanges(heroData, "hp", onHpChange);
                    watchObjPropertyChanges(heroData, "maxhp", onMaxHpChange);
                    watchObjPropertyChanges(heroData, "warrior_stats", onWarriorStatsChange);
                    watchObjPropertyChanges(unsafeWindow.Engine, "dead", onHeroDead);
                }, 100);
            }
        }, 100);
    }

	createContainer() {
        const self = this;
		GM_addStyle(`
			#ah-container {
				width: 300px;
				background-color: rgba(40, 40, 40, 0.85);
				border: 1px solid #a7a8b5;
				border-radius: 5px;
				color: white;
				position: absolute;
				z-index: 300;
				box-shadow: 0 4px 12px #0c0c0c !important;
				font-family: 'Arial', sans-serif !important;
				transition: box-shadow 0.3s ease, opacity 0.3s ease, width 0.4s ease;
				opacity: 0.7;
			}
			#ah-container.shrinked {
				opacity: 0.6;
			}
            #ah-container.shrinked,
            .shrinked #ah-container-header,
            .shrinked #ah-container-body {
				width: 122px;
			}
			#ah-container:hover {
				box-shadow: 0px 5px 18px #414141 !important;
				opacity: 1;
			}
            #ah-container > * {
                pointer-events: auto;
            }

			#ah-container-header {
                width: 300px;
				min-height: 19px;
				background: linear-gradient(180deg, rgba(68, 68, 68, 0.8), rgba(34, 34, 34, 0.8));
				border-bottom: 1px solid #555;
				border-top-left-radius: 5px;
				border-top-right-radius: 5px;
				cursor: move !important;
				text-align: center;
				font-weight: bold;
				font-size: 14px;
				letter-spacing: 1px;
				line-height: 1.3;
			}
			#ah-container-header #ah-expand-icon {
				position: absolute;
				right: 0;
                top: 0;
                line-height: 1;
                cursor: url(https://aldous.margonem.pl/img/gui/cursor/5n.png?v=1728634377350) 4 0, url(https://aldous.margonem.pl/img/gui/cursor/5n.cur?v=1728634377350) 4 0, auto !important;
                z-index: 1;
			}
            #ah-container #ah-expand-icon > svg {
                transition: transform 0.4s;
                height: 13px;
                width: 13px;
                padding: 8px;
                transform: rotate(180deg);
            }
            #ah-container.shrinked #ah-expand-icon > svg {
                height: 11px;
                width: 11px;
                padding: 3px;
                margin-top: 1px;
                transform: rotate(0deg);
            }
			#ah-container-header .ah-h-small {
                font-size: 0.7rem;
				right: 6px;
			}
            #ah-container #heal-active-checkbox {
                margin-left: 7px;
                transition: margin-left 0.2s;
            }
            #ah-container.shrinked #heal-active-checkbox {
                transform: scale(0.9);
                margin-left: 1px;
            }

			#ah-container-body {
                width: 300px;
                height: 380px;
                font-size: 0.95em;
                overflow-y: scroll;
                overflow: hidden auto;
				border-bottom-left-radius: 5px;
				border-bottom-right-radius: 5px;
				cursor: url(/img/gui/cursor/1n.png?v=1728634377350), url(/img/gui/cursor/1n.cur?v=1728634377350), auto;
				display: block;
                z-index: 301;
			}

            #ah-container-body::-webkit-scrollbar {
			    width: 6px;
			}
			#ah-container-body::-webkit-scrollbar-thumb {
			    background-color: #444444;
			    border-radius: 10px;
			}
			#ah-container-body::-webkit-scrollbar-track {
			    background-color: #2c2c2c;
			}
			#ah-container-body::-webkit-scrollbar-thumb:hover {
			    background-color: #555555;
			}

			#ah-container input,
            #ah-container button {
				border-radius: 5px;
				background: #3b3b3b;
				color: white;
			}
            #ah-container button {
                cursor: url(/img/gui/cursor/1n.png?v=1728634377350), url(/img/gui/cursor/1n.cur?v=1728634377350), auto;
            }
            #ah-container button.h-manual-heal-btn-sm {
                font-size: 0.7rem;
                padding: 0 0.25rem;
                margin: 0 0.125rem;
            }
            #ah-container-body #hMinHealHpPercent {
                width: 40px;
            }
            #ah-container-body #hMinPotionHealing {
                width: 80px;
            }
            #ah-container-body #hIgnoredItems {
                width: 100%;
            }

			#ah-container-body p {
				margin: 0;
				font-size: 13px;
				color: #ddd;
			}

			#ah-container-body a {
				color: #1e90ff;
				text-decoration: none;
				transition: color 0.3s ease;
			}

			#ah-container-body a:hover {
				color: #63b8ff;
			}

			#ah-container .checkbox {
				cursor: url(/img/gui/cursor/1n.png?v=1728634377350), url(/img/gui/cursor/1n.cur?v=1728634377350), auto !important;
				z-index: 1;
				flex-shrink: 0;
			}
            #ah-container .light-up {
                box-shadow: 0 0 3px 4px rgba(92, 215, 0, 0.8);
                transition: box-shadow 0.3s ease-in-out;
            }

			.leg-color {
				color: #f19b5c;
			}
			.upgraded-color {
				color: #f572d0;
			}
			.hero-color {
				color: #6abad7;
			}
			.uni-color {
				color: #f5f35c;
			}
			.common-color {
				color: #b1b1b1;
			}

			.text-bon {
				font-family: none !important;
				font-size: 15px;
			}

			/* Bootstrap 5.3 */
			.shadow {
				box-shadow: 0 .5rem 1rem rgba(0,0,0,.15);
			}

			.d-flex {
				display: flex;
			}
			.align-items-center {
				align-items: center;
			}
			.justify-content-center {
				justify-content: center;
			}
			.position-absolute {
				position: absolute;
			}

			.text-nowrap {
				white-space: nowrap;
			}
			.text-end {
				text-align: right;
			}
			.small {
				font-size: 0.875em;
			}

			.mx-1 {
				margin-left: 0.25rem!important;
				margin-right: 0.25rem!important;
			}
			.mx-2 {
				margin-left: 0.5rem!important;
				margin-right: 0.5rem!important;
			}
			.my-1 {
				margin-top: 0.25rem!important;
				margin-bottom: 0.25rem!important;
			}
			.my-2 {
				margin-top: 0.5rem!important;
				margin-bottom: 0.5rem!important;
			}
			.me-1 {
				margin-right: 0.25rem!important;
			}
			.me-2 {
				margin-right: 0.5rem!important;
			}
			.ms-1 {
				margin-left: 0.25rem!important;
			}
			.ms-2 {
				margin-left: 0.5rem!important;
			}
			.mt-1 {
				margin-top: 0.25rem!important;
			}
			.mt-2 {
				margin-top: 0.5rem!important;
			}
			.mb-1 {
				margin-bottom: 0.25rem!important;
			}
			.mb-2 {
				margin-bottom: 0.5rem!important;
			}


			.ps-1 {
				padding-left: 0.25rem!important;
			}
			.p-2 {
				padding: 0.5rem!important;
			}
			.py-2 {
				padding-top: 0.5rem!important;
                padding-bottom: 0.5rem!important;
			}

			.overflow-hidden {
				overflow: hidden;
			}

			.fw-bold {
				font-weight: bold;
			}
			.lh-sm {
				line-height: 1.1;
			}
            .lh-sm-p {
                line-height: 1.25;
            }
			.w-100 {
				width: 100%;
			}

			.start-0 {
				left: 0;
			}

			.align-items-center {
				align-items: center;
			}

			/* HP Indicator */
			.ah-hp-number-display {
				position: absolute;
				text-shadow: 0px 0px 6px rgb(0 0 0);
				font-size: 17px;
				z-index: 2;
				width: 100%;
				text-align: center;
				letter-spacing: 0.02rem;
				top: -16px;
				color: #f9eff9;
				pointer-events: none;
			}
		`);

		// Create container HTML
		const containerHTML = `
			<div id="ah-container" class="shadow${this.options.shrinked ? ' shrinked' : ''}">
				<div id="ah-container-header" class="d-flex align-items-center justify-content-center" title="Przeciągnij - Kliknij dwukrotnie aby zwinąć/rozwinąć">
					<div class="position-absolute start-0" style="z-index:1" title="Włącz/Wyłącz AutoHeal">
						<div class="checkbox my-1${this.options.active ? ' active' : ''}" id="heal-active-checkbox" data-opt="active"></div>
					</div>
					<div class="position-absolute w-100 ah-h-small text-end me-2"${this.options.shrinked ? '' : ' style="display: none;"'}>AH v${this.version}<button class="h-manual-heal-btn h-manual-heal-btn-sm" title="Ulecz ręcznie">Lecz</button></div>
                    <div id="ah-expand-icon" title="Zwiń/Rozwiń">
						<svg fill="#000000" viewBox="0 0 330 330" xml:space="preserve" style="fill: white !important;">
							<g id="XMLID_88_">
								<path id="XMLID_89_" d="M304.394,139.394l-139.39,139.393L25.607,139.393c-5.857-5.857-15.355-5.858-21.213,0.001
									c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393s7.794-1.581,10.606-4.394l149.996-150
									c5.858-5.858,5.858-15.355,0-21.213C319.749,133.536,310.251,133.535,304.394,139.394z"></path>
								<path id="XMLID_90_" d="M154.398,190.607c2.813,2.813,6.628,4.393,10.606,4.393s7.794-1.581,10.606-4.394l149.996-150
									c5.858-5.858,5.858-15.355,0-21.213c-5.857-5.858-15.355-5.858-21.213,0l-139.39,139.393L25.607,19.393
									c-5.857-5.858-15.355-5.858-21.213,0c-5.858,5.858-5.858,15.355,0,21.213L154.398,190.607z"></path>
							</g>
						</svg>
                    </div>
					<div class="ah-h-big text-nowrap w-100"${this.options.shrinked ? ' style="display: none;"' : ''}>
						<span>AutoHeal v${this.version}</span><div class="lh-sm text-center" style="font-size: 0.6rem;">by Paladynka Yuuki</div>
					</div>
				</div>
				<div id="ah-container-body" ${this.options.shrinked ? ' style="display: none;"' : ''}>
					<div class="p-2">
						<div class="mb-2">
							<div class="mb-1 d-flex" style="display: flex;justify-content: space-between;align-items: baseline;">
                                <div>Opcje leczenia</div>
                                <button class="h-manual-heal-btn" title="Ulecz ręcznie">Ulecz</button>
                            </div>
							<div class="ps-1">
								<div class="mb-1 d-flex align-items-center"><div class="checkbox${this.options.hPotion ? ' active' : ''}" id="opt-potion-heal" data-opt="hPotion"></div><div class="label ms-1 lh-sm">Mikstury</div></div>
								<div class="mb-1 d-flex align-items-center"><div class="checkbox${this.options.hFull ? ' active' : ''}" id="opt-full-heal" data-opt="hFull"></div><div class="label ms-1 lh-sm">Pełne leczenie</div></div>
								<div class="d-flex align-items-center"><div class="checkbox${this.options.hPercent ? ' active' : ''}" id="opt-percent-heal" data-opt="hPercent"></div><div class="label ms-1 lh-sm">Mikstury procentowe</div></div>
								<br>
                                <div class="mb-1 d-flex align-items-center"><div class="checkbox${this.options.hHealAfterDeath ? ' active' : ''}" id="opt-heal-after-death" data-opt="hHealAfterDeath"></div><div class="label ms-1 lh-sm">Lecz po śmierci</div></div>
								<div class="d-flex"><div class="checkbox${this.options.hHealToFull ? ' active' : ''}" id="opt-heal-to-full" data-opt="hHealToFull"></div><div class="label ms-1 lh-sm-p">Zawsze lecz do pełna (nawet gdy zmarnujesz część mikstury), jeśli życie spadnie poniżej <input type="number" id="hMinHealHpPercent" value="${this.options.hMinHealHpPercent}" min="1" max="100"/>%</div></div>
								<div class="d-flex align-items-center mt-2 lh-sm"><input type="number" class="me-2" id="hMinPotionHealing" value="${this.options.hMinPotionHealing}" min="0" /> Minimalna wartość leczenia mikstury</div>
							</div>
						</div>
						<div class="mb-2">
							<div class="mb-1">Dozwolone typy przedmiotów</div>
							<div class="ps-1 d-flex">
								<div class="d-flex align-items-center" title="Pozpolite"><div class="checkbox${this.options.hRarity.includes('P') ? ' active' : ''}" id="opt-rarity-p" data-rarity="P"></div><div class="label me-1 lh-sm fw-bold common-color text-bon">*P*</div></div>
								<div class="d-flex align-items-center" title="Unikatowe"><div class="checkbox${this.options.hRarity.includes('U') ? ' active' : ''}" id="opt-rarity-u" data-rarity="U"></div><div class="label me-1 lh-sm fw-bold uni-color text-bon">*U*</div></div>
								<div class="d-flex align-items-center" title="Heroiczne"><div class="checkbox${this.options.hRarity.includes('H') ? ' active' : ''}" id="opt-rarity-h" data-rarity="H"></div><div class="label me-1 lh-sm fw-bold hero-color text-bon">*H*</div></div>
								<div class="d-flex align-items-center" title="Ulepszone"><div class="checkbox${this.options.hRarity.includes('Ul') ? ' active' : ''}" id="opt-rarity-ul" data-rarity="Ul"></div><div class="label me-1 lh-sm fw-bold upgraded-color text-bon">*Ul*</div></div>
								<div class="d-flex align-items-center" title="Legendarne"><div class="checkbox${this.options.hRarity.includes('L') ? ' active' : ''}" id="opt-rarity-l" data-rarity="L"></div><div class="label me-1 lh-sm fw-bold leg-color text-bon">*L*</div></div>
							</div>
						</div>
						<div class="mb-2">
							<div class="mb-1">Inne opcje</div>
							<div class="ps-1">
								<div class="mb-1 d-flex align-items-center"><div class="checkbox${this.options.hNotify ? ' active' : ''}" id="opt-notify" data-opt="hNotify"></div><div class="label ms-1 lh-sm">Komunikat o użytym przedmiocie</div></div>
								<div class="d-flex align-items-center"><div class="checkbox${this.options.hHpNumDisplay ? ' active' : ''}" id="opt-show-hp-display" data-opt="hHpNumDisplay"></div><div class="label ms-1 lh-sm">Wyświetl Punkty Życia nad "kulką"</div></div>
							</div>
						</div>
                        <div class="mb-2 ignored-items-container">
							<div class="mb-1">Ignorowane przedmioty (<span id="ignored-items-count">${this.ignoredItems.length}</span>)</div>
							<div class="me-2">
							    <input type="text" id="hIgnoredItems" value="${this.options.hIgnoredItems}">
							</div>
					    </div>
					</div>
				</div>
			</div>
		`;

		function appendContainerToBody(containerHTML) {
            unsafeWindow.Engine.interface.get$dropToDeleteWidgetLayer().append(containerHTML);
		}

		function handleOptionClick() {
			const type = $(this).data('opt');
			$(this).toggleClass('active');
			self.options[type] = !self.options[type];
			GM_setValue(self.heroId+'ah-' + type, self.options[type] ? '1' : '0');

			if (type === 'active') {
				unsafeWindow.message(`AutoHeal ${(self.options[type] ? " włączony " : " wyłączony")}`);
			}
			if (type === 'hHpNumDisplay') {
				if (self.options[type]) {
					self.$hpPointerContainer.text(`${self.hp} / ${self.maxhp}`);
				}
				$('.ah-hp-number-display').stop(true, true).fadeToggle("fast");
			}
		}

		function handleRarityClick() {
			const rarity = $(this).data('rarity');
			$(this).toggleClass('active');
			if ($(this).hasClass('active')) {
				self.options.hRarity.push(rarity);
			} else {
				self.options.hRarity = self.options.hRarity.filter(r => r !== rarity);
			}
			GM_setValue(self.heroId+'ah-hRarity', JSON.stringify(self.options.hRarity));
		}

		function handleLabelClick(e) {
			if ($(e.target).is("input")) return;
			$(this).prev().trigger('click');
		}

		function handleManualHealClick() {
			self.autoHeal(true);
		}

		function handleMinHealHpPercentChange() {
			let minHealHpPercent = $(this).val();
			const minVal = parseInt($(this).attr("min"));
			const maxVal = parseInt($(this).attr("max"));

			if (minHealHpPercent === 0 || minHealHpPercent === "" || minHealHpPercent > maxVal || minHealHpPercent < minVal) {
				return;
			}

			self.options.hMinHealHpPercent = minHealHpPercent;
			GM_setValue(self.heroId+'ah-hMinHealHpPercent', minHealHpPercent);
		}

		function handleMinHealHpPercentFocusOut() {
			let minHealHpPercent = $(this).val();
			const minVal = parseInt($(this).attr("min"));
			const maxVal = parseInt($(this).attr("max"));

			if (minHealHpPercent === 0 || minHealHpPercent === "" || minHealHpPercent > maxVal || minHealHpPercent < minVal) {
				$(this).val(self.options.hMinHealHpPercent);
			}
		}

		function handleMinPotionHealingChange() {
			let minPotionHealing = $(this).val();
			const minVal = parseInt($(this).attr("min"));

			if (minPotionHealing === "" || minPotionHealing < minVal) {
				return;
			}

			self.options.hMinPotionHealing = minPotionHealing;
			GM_setValue(self.heroId+'ah-hMinPotionHealing', minPotionHealing);
		}

		function handleMinPotionHealingFocusOut() {
			let minPotionHealing = $(this).val();
			const minVal = parseInt($(this).attr("min"));

			if (minPotionHealing === "" || minPotionHealing < minVal) {
				self.options.hMinPotionHealing = 0;
				GM_setValue(self.heroId+'ah-hMinPotionHealing', '0');
				$(this).val(0);
			}
		}

        function handleIgnoredChange() {
			let ignoredText = $(this).val().trim();
			self.options.hIgnoredItems = ignoredText;
			GM_setValue(self.heroId+'ah-hIgnoredItems', ignoredText);
		}

        function handleIgnoredFocusOut() {
            let ignoredText = $(this).val().trim();
            let ignoredArray = self.getIgnoredItemsArray(ignoredText);

            let parsedIgnoredText = ignoredArray.join(", ");
            self.options.hIgnoredItems = parsedIgnoredText;
            GM_setValue(self.heroId+'ah-hIgnoredItems', parsedIgnoredText);
            $(this).val(parsedIgnoredText);

            self.ignoredItems = ignoredArray;
            unsafeWindow.message(`Zapisano ignorowane przedmioty (${ignoredArray.length})`);
            document.querySelector('.ignored-items-container #ignored-items-count').innerText = ignoredArray.length;
        }

        function handleIgnoredItemDropping() {
            // Adding ignored items by draging items
            let ignoreDefaultItemDrop = false;
            $('.ignored-items-container').droppable({
                greedy: true,
                accept: '.item',
                drop: (e, { draggable, position, helper }) => {
                    ignoreDefaultItemDrop = true;

                    helper.hide();
                    const target = document.elementFromPoint(position.left, position.top);
                    helper.show();

                    const ignoreInputValue = self.options.hIgnoredItems;
                    const itemName = draggable.attr('data-name');

                    if (ignoreInputValue.includes(itemName)) return;

                    const ignoreInput = $('#hIgnoredItems');
                    ignoreInput.val( ignoreInputValue !== "" ? ignoreInputValue+', '+itemName : itemName );
                    ignoreInput.trigger("focusout");
                    setTimeout(()=>{
                        ignoreDefaultItemDrop = false;
                    }, 2);
                },
                activate: function() {
                    $(this).addClass("light-up");
                },
                deactivate: function() {
                    $(this).removeClass("light-up");
                }
            });

            const originalmAlert = unsafeWindow.mAlert;
            unsafeWindow.mAlert = function(t,e,i,n) {
                if (t.includes('Co chcesz zrobić z tym przedmiotem?')) {
                    setTimeout(()=>{
                        if (!ignoreDefaultItemDrop) originalmAlert.call(this, t,e,i,n);
                    }, 1);
                    return;
                }

                originalmAlert.call(this, t,e,i,n);
            };
        }

		function ensureInBounds($container) {
			const winWidth = $(window).width();
			const winHeight = $(window).height();
			const contWidth = $container.outerWidth();
			const contHeight = $container.outerHeight();

			let left = parseInt($container.css('left'));
			let top = parseInt($container.css('top'));

			left = Math.max(0, Math.min(left, winWidth - contWidth));
			top = Math.max(0, Math.min(top, winHeight - contHeight));

			$container.css({ left: left + 'px', top: top + 'px' });
		}

		function initializeDragging($header, $container) {
            $container.draggable(
                {
                    containment: "body",
                    handle: $header,
                    start: () => {
                        $header.css('cursor', 'grabbing');
                    },
                    stop: () => {
                        $header.css('cursor', 'grab');
                        const left = $container.css('left');
                        const top = $container.css('top');
                        GM_setValue(self.heroId+'ah-c-pos', JSON.stringify({ left, top }));
                    }
                }
            );
        }

		function restoreContainerPosition($container) {
			const savedPosition = GM_getValue(self.heroId+'ah-c-pos', null);
			if (savedPosition) {
				const { left, top } = JSON.parse(savedPosition);
				$container.css({ left, top });
			} else {
				$container.css({ top: '100px', left: '100px' });
			}
		}

        function initializeScrolling($body) {
            let isScrolling = false;
            $body.on('wheel', function(event) {
                event.preventDefault();
                var currentScroll = $(this).scrollTop();
                var delta = event.originalEvent.deltaY;
                var scrollSpeed = 5;
                var targetScroll = currentScroll + delta * scrollSpeed;

                if (!isScrolling) {
                    isScrolling = true;
                    $(this).stop().animate(
                        { scrollTop: targetScroll },
                        {
                            duration: 100,
                            easing: 'swing',
                            complete: function() {
                                isScrolling = false;
                            }
                        }
                    );
                }
            });
        }

		function handleHeaderDblClick($header, $body) {
			$header.on('dblclick', function(e) {
				if ($(e.target).hasClass("checkbox")) return;

                self.options.shrinked = !self.options.shrinked;
				GM_setValue(self.heroId+'ah-shrinked', self.options.shrinked ? '1' : '0');

                if (self.options.shrinked) {
                    $body.stop(true, true).slideToggle();
                    $('.ah-h-big').stop(true, true).fadeToggle("fast");

                    setTimeout(() => {
                        $('.ah-h-small').stop(true, true).fadeToggle("fast");
                        $('#ah-container').toggleClass('shrinked');
                    }, 400);
                } else {
                    $('.ah-h-small, .ah-h-big').stop(true, true).fadeToggle("fast");
                    $('#ah-container').toggleClass('shrinked');
                    setTimeout(() => {
                        $body.stop(true, true).slideToggle();
                    }, 400);
                }

			});
		}

        function handleExpandIconClick($header) {
            $('#ah-expand-icon').click(()=>{ $header.trigger('dblclick'); });
        }

		function initializeEventListeners() {
			$('#heal-active-checkbox, #opt-potion-heal, #opt-full-heal, #opt-percent-heal, #opt-heal-after-death, #opt-heal-to-full, #opt-notify, #opt-show-hp-display').on('click', handleOptionClick);
			$('#opt-rarity-p, #opt-rarity-u, #opt-rarity-h, #opt-rarity-ul, #opt-rarity-l').on('click', handleRarityClick);
			$('#ah-container-body div.label').on('click', handleLabelClick);
			$('.h-manual-heal-btn').on('click', handleManualHealClick);
			$('#hMinHealHpPercent').on('input change', handleMinHealHpPercentChange).on('focusout', handleMinHealHpPercentFocusOut);
			$('#hMinPotionHealing').on('input change', handleMinPotionHealingChange).on('focusout', handleMinPotionHealingFocusOut);
            $('#hIgnoredItems').on('change keyup paste', handleIgnoredChange).on('focusout', handleIgnoredFocusOut);
            handleIgnoredItemDropping();

			$(window).on('resize', () => ensureInBounds($('#ah-container')));
		}

		function init() {
			appendContainerToBody(containerHTML);

			const $container = $('#ah-container');
			const $header = $('#ah-container-header');
			const $body = $('#ah-container-body');

			initializeDragging($header, $container);
			restoreContainerPosition($container);
            initializeScrolling($body);
			handleHeaderDblClick($header, $body);
            handleExpandIconClick($header);
			initializeEventListeners();
		}

		init();
	}

    getIgnoredItemsArray(ignoredText) {
        return ignoredText.split(/[;,]/).map(itemName => {
            let trimmedName = itemName.trim();
            return trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase();
        }).filter(itemName => itemName !== "");
    }

    useItem(item, supress = false) {
        const { name, id } = item;

        unsafeWindow._g(`moveitem&st=1&id=${id}`, () => {
            setTimeout(() => this.autoHeal(supress), this.healInterval);
        });
    }

	getItemWithMaxPropValue(items, property) {
		if (items.length > 0) {
            return items.reduce((first, second) =>
                second._cachedStats[property] > first._cachedStats[property] ? second : first
            );
        }
	}
    getItemWithMinPropValue(items, property) {
		if (items.length > 0) {
            return items.reduce((first, second) =>
                parseInt(second._cachedStats[property]) < parseInt(first._cachedStats[property]) ? second : first
            );
        }
	}

    getPotions(hp, maxhp, lvl) {
        const potions = !this.options.hPotion ? [] : this.Engine.items
                .fetchLocationItems("g")
                .filter((item) => !this.ignoredItems.includes(item.name))
                .filter((item) => item._cachedStats.hasOwnProperty("leczy"))
				.filter((item) => this.options.hRarity.includes( this.rarityDict[item._cachedStats.rarity] ))
                .filter((item) => parseInt(item._cachedStats.leczy) >= this.options.hMinPotionHealing)
                .filter(
                    (item) =>
                        !item._cachedStats.hasOwnProperty("lvl") ||
                        (item._cachedStats.hasOwnProperty("lvl") && item._cachedStats.lvl <= lvl)
                )
                .filter(
                    (item) =>
                        !item._cachedStats.hasOwnProperty("timelimit") ||
                        (item._cachedStats.hasOwnProperty("timelimit") && !item._cachedStats.timelimit.includes(","))
                );

        return potions;
    }
    getFullHeals(hp, maxhp, lvl) {
        const fullHeals = !this.options.hFull ? [] : this.Engine.items
                .fetchLocationItems("g")
                .filter((item) => !this.ignoredItems.includes(item.name))
                .filter((item) => item._cachedStats.hasOwnProperty("fullheal"))
				.filter((item) => this.options.hRarity.includes( this.rarityDict[item._cachedStats.rarity] ))
                .filter(
                    (item) =>
                        !item._cachedStats.hasOwnProperty("lvl") ||
                        (item._cachedStats.hasOwnProperty("lvl") && item._cachedStats.lvl <= lvl)
                )
                .filter(
                    (item) =>
                        !item._cachedStats.hasOwnProperty("timelimit") ||
                        (item._cachedStats.hasOwnProperty("timelimit") && !item._cachedStats.timelimit.includes(","))
                );

        return fullHeals;
    }
    getPercentHeals(hp, maxhp, lvl) {
        const percentHeals = !this.options.hPercent ? [] : this.Engine.items
                .fetchLocationItems("g")
                .filter((item) => !this.ignoredItems.includes(item.name))
                .filter((item) => item._cachedStats.hasOwnProperty("perheal"))
				.filter((item) => this.options.hRarity.includes( this.rarityDict[item._cachedStats.rarity] ))
                .filter((item) => hp === 1 || item._cachedStats.perheal <= ((maxhp - hp) * 100) / maxhp)
                .filter(
                    (item) =>
                        !item._cachedStats.hasOwnProperty("lvl") ||
                        (item._cachedStats.hasOwnProperty("lvl") && item._cachedStats.lvl <= lvl)
                )
                .filter(
                    (item) =>
                        !item._cachedStats.hasOwnProperty("timelimit") ||
                        (item._cachedStats.hasOwnProperty("timelimit") && !item._cachedStats.timelimit.includes(","))
                );

        return percentHeals;
    }

    autoHeal(supress = false) {
        if ((!supress && !this.options.active) || this.Engine.dead) {
            return;
        }

        const hp = this.hp ?? this.Engine.hero.d.warrior_stats.hp;
        const maxhp = this.maxhp ?? this.Engine.hero.d.warrior_stats.maxhp;

        if (hp < maxhp) {
            const lvl = this.Engine.hero.d.lvl;

            const allPotions = this.getPotions(hp, maxhp, lvl);
            const potions = allPotions.filter((item) => parseInt(item._cachedStats.leczy) <= (maxhp - hp));
            const fullHeals = this.getFullHeals(hp, maxhp, lvl);
            const percentHeals = this.getPercentHeals(hp, maxhp, lvl);

            let item;
            if (potions.length > 0)
                item = this.getItemWithMinPropValue(potions, 'amount');
            else if (fullHeals.length > 0)
                item = this.getItemWithMinPropValue(fullHeals, 'fullheal');
            else if (percentHeals.length > 0)
                item = this.getItemWithMaxPropValue(percentHeals, 'perheal');
            else if (allPotions.length > 0 && this.options.hHealToFull && this.options.hMinHealHpPercent > ((hp/maxhp)*100))
                item = this.getItemWithMinPropValue(allPotions, 'leczy');

            if (item !== undefined) {
                this.useItem(item, supress);
				if(this.options.hNotify) {
					unsafeWindow.message('Uleczono: '+item.name+' (*'+this.rarityDict[item._cachedStats.rarity]+'*)');
				}
            }
        }
    }
}

(function() {
    'use strict';

    // Initialize AutoHeal
    unsafeWindow.mAutoHeal = new YuukiAutoHeal();
})();
