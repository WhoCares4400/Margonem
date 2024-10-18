// ==UserScript==
// @name         Margonem AutoHeal [NI]
// @namespace    http://tampermonkey.net/
// @version      1.6
// @updateURL    https://github.com/WhoCares4400/Margonem/raw/refs/heads/main/YuukiAutoHeal.user.js
// @downloadURL  https://github.com/WhoCares4400/Margonem/raw/refs/heads/main/YuukiAutoHeal.user.js
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
// @grant        unsafeWindow
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

class YuukiAutoHeal {
    constructor() {
        if (this.isOldInterface()) {
            console.error("AutoHeal działa tylko w NOWYM INTERFEJSIE!");
            return;
        }

        this.initializeProperties();
        this.createContainer();
        this.initializeAutoHealDetection();
        this.initializeHpDataCollection();
    }

    isOldInterface() {
        return unsafeWindow.getCookie("interface") === 'si';
    }

    initializeProperties() {
        const self = this;

        this.version = '1.6';
        this.healInterval = 150; // ms

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
            active: Boolean(parseInt(localStorage.getItem('ah-active') ?? 1)),
            shrinked: Boolean(parseInt(localStorage.getItem('ah-shrinked') ?? 0)),
            hPotion: Boolean(parseInt(localStorage.getItem('ah-hPotion') ?? 1)),
            hFull: Boolean(parseInt(localStorage.getItem('ah-hFull') ?? 0)),
            hPercent: Boolean(parseInt(localStorage.getItem('ah-hPercent') ?? 0)),
            hHealToFull: Boolean(parseInt(localStorage.getItem('ah-hHealToFull') ?? 0)),
            hMinHealHpPercent: parseInt(localStorage.getItem('ah-hMinHealHpPercent') ?? 80),
            hMinPotionHealing: parseInt(localStorage.getItem('ah-hMinPotionHealing') ?? 0),
            rarity: JSON.parse(localStorage.getItem('ah-hRarity')) || ['L', 'Ul', 'H', 'U', 'P'],
            hNotify: Boolean(parseInt(localStorage.getItem('ah-hNotify') ?? 1)),
            hHpNumDisplay: Boolean(parseInt(localStorage.getItem('ah-hHpNumDisplay') ?? 1))
        };
    }

    initializeAutoHealDetection() {
        const self = this;
        //Create heal detection
        const autoHealInitializationInterval = setInterval(() => {
            if (unsafeWindow.Engine && unsafeWindow.Engine.battle && unsafeWindow.Engine.battle.hasOwnProperty('endBattle')) {
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

                this.Engine = unsafeWindow.getEngine();
            }
        }, 100);
    }
    initializeHpDataCollection() {
        const self = this;
        //Create HP data collection
        const hpIndicatorInitializationInterval = setInterval(() => {
            if (unsafeWindow.Engine && unsafeWindow.Engine.hero && unsafeWindow.Engine.hero.d && unsafeWindow.Engine.hero.d.warrior_stats && unsafeWindow.Engine.hero.d.warrior_stats.hasOwnProperty('hp')) {
                clearInterval(hpIndicatorInitializationInterval);

                self.hp = unsafeWindow.Engine.hero.d.warrior_stats.hp;
                self.maxhp = unsafeWindow.Engine.hero.d.warrior_stats.maxhp;

                this.$hpPointerContainer = $(`<div class="ah-hp-number-display"${this.options.hHpNumDisplay ? '' : ' style="display: none;"'}>${self.hp} / ${self.maxhp}</div>`);
                $('.hp-indicator-wrapper-template').prepend(this.$hpPointerContainer);

                setTimeout(() => {
                    let heroData = unsafeWindow.Engine.hero.d;

                    function watchWarriorStatsObjChanges(obj, propertyName) {
                        let value = obj[propertyName];

                        Object.defineProperty(obj, propertyName, {
                            get() {
                                return value;
                            },
                            set(ws) {
                                onHpChange(ws.hp);
                                onMaxHpChange(ws.maxhp);

                                value = ws;
                            },
                            configurable: true
                        });
                    }

                    function watchHpPropertyChanges(obj, propertyName, callback) {
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

                    watchHpPropertyChanges(heroData, "hp", onHpChange);
                    watchHpPropertyChanges(heroData, "maxhp", onMaxHpChange);
                    watchWarriorStatsObjChanges(heroData, "warrior_stats");
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
				width: 100px;
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
				min-height: 25px;
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
                padding: 5px;
				right: 0;
                top: 0;
                line-height: 1;
                transition: transform 0.3s;
                cursor: url(https://aldous.margonem.pl/img/gui/cursor/5n.png?v=1728634377350) 4 0, url(https://aldous.margonem.pl/img/gui/cursor/5n.cur?v=1728634377350) 4 0, auto !important;
                z-index: 1;
			}
			#ah-container-header .ah-h-small {
				right: 14px;
			}

			#ah-container-body {
                width: 300px;
                height: 380px;
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

			#ah-container-body input[type="number"],
            #ah-container-body button {
				border-radius: 5px;
				background: #3b3b3b;
				color: white;
			}
            #ah-container-body #hMinHealHpPercent {
                width: 40px;
            }
            #ah-container-body #hMinPotionHealing {
                width: 80px;
            }
            #ah-container-body button {
                cursor: url(/img/gui/cursor/1n.png?v=1728634377350), url(/img/gui/cursor/1n.cur?v=1728634377350), auto;
            }

			#ah-container-body p {
				margin: 0;
				font-size: 13px;
				color: #ddd; /* Lighter text color for modern feel */
			}

			#ah-container-body a {
				color: #1e90ff; /* Modern blue for links */
				text-decoration: none;
				transition: color 0.3s ease; /* Smooth link color transition */
			}

			#ah-container-body a:hover {
				color: #63b8ff; /* Lighter blue on hover */
			}

			#ah-container .checkbox {
				cursor: url(/img/gui/cursor/1n.png?v=1728634377350), url(/img/gui/cursor/1n.cur?v=1728634377350), auto !important;
				z-index: 1;
				flex-shrink: 0;
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
					<div class="position-absolute w-100 small ah-h-small text-end me-2"${this.options.shrinked ? '' : ' style="display: none;"'}>AH v${this.version}</div>
                    <div id="ah-expand-icon"${this.options.shrinked ? '' : ' style="transform: rotate(180deg)"'} title="Zwiń/Rozwiń">
						<svg fill="#000000" height="13px" width="13px" viewBox="0 0 330 330" xml:space="preserve" style="fill: white !important;">
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
                                <button id="h-manual-heal-btn">Ulecz</button>
                            </div>
							<div class="ps-1">
								<div class="mb-1 d-flex align-items-center"><div class="checkbox${this.options.hPotion ? ' active' : ''}" id="opt-potion-heal" data-opt="hPotion"></div><div class="label ms-1 lh-sm">Mikstury</div></div>
								<div class="mb-1 d-flex align-items-center"><div class="checkbox${this.options.hFull ? ' active' : ''}" id="opt-full-heal" data-opt="hFull"></div><div class="label ms-1 lh-sm">Pełne leczenie</div></div>
								<div class="d-flex align-items-center"><div class="checkbox${this.options.hPercent ? ' active' : ''}" id="opt-percent-heal" data-opt="hPercent"></div><div class="label ms-1 lh-sm">Mikstury procentowe</div></div>
								<br>
								<div class="d-flex"><div class="checkbox${this.options.hHealToFull ? ' active' : ''}" id="opt-heal-to-full" data-opt="hHealToFull"></div><div class="label ms-1 lh-sm">Zawsze lecz do pełna (nawet gdy zmarnujesz część mikstury), jeśli życie spadnie poniżej <input type="number" id="hMinHealHpPercent" value="${this.options.hMinHealHpPercent}" min="1" max="100"/>%</div></div>
								<div class="d-flex align-items-center mt-2"><input type="number" class="me-2" id="hMinPotionHealing" value="${this.options.hMinPotionHealing}" min="0" /> Minimalna wartość leczenia mikstury</div>
							</div>
						</div>
						<div class="mb-2">
							<div class="mb-1">Dozwolone typy przedmiotów</div>
							<div class="ps-1 d-flex">
								<div class="d-flex align-items-center" title="Pozpolite"><div class="checkbox${this.options.rarity.includes('P') ? ' active' : ''}" id="opt-rarity-p" data-rarity="P"></div><div class="label me-1 lh-sm fw-bold common-color text-bon">*P*</div></div>
								<div class="d-flex align-items-center" title="Unikatowe"><div class="checkbox${this.options.rarity.includes('U') ? ' active' : ''}" id="opt-rarity-u" data-rarity="U"></div><div class="label me-1 lh-sm fw-bold uni-color text-bon">*U*</div></div>
								<div class="d-flex align-items-center" title="Heroiczne"><div class="checkbox${this.options.rarity.includes('H') ? ' active' : ''}" id="opt-rarity-h" data-rarity="H"></div><div class="label me-1 lh-sm fw-bold hero-color text-bon">*H*</div></div>
								<div class="d-flex align-items-center" title="Ulepszone"><div class="checkbox${this.options.rarity.includes('Ul') ? ' active' : ''}" id="opt-rarity-ul" data-rarity="Ul"></div><div class="label me-1 lh-sm fw-bold upgraded-color text-bon">*Ul*</div></div>
								<div class="d-flex align-items-center" title="Legendarne"><div class="checkbox${this.options.rarity.includes('L') ? ' active' : ''}" id="opt-rarity-l" data-rarity="L"></div><div class="label me-1 lh-sm fw-bold leg-color text-bon">*L*</div></div>
							</div>
						</div>
						<div class="mb-2">
							<div class="mb-1">Inne opcje</div>
							<div class="ps-1">
								<div class="mb-1 d-flex align-items-center"><div class="checkbox${this.options.hNotify ? ' active' : ''}" id="opt-notify" data-opt="hNotify"></div><div class="label ms-1 lh-sm">Komunikat o użytym przedmiocie</div></div>
								<div class="d-flex align-items-center"><div class="checkbox${this.options.hHpNumDisplay ? ' active' : ''}" id="opt-show-hp-display" data-opt="hHpNumDisplay"></div><div class="label ms-1 lh-sm">Wyświetl Punkty Życia nad "kulką"</div></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

        function appendContainerToBody(containerHTML) {
            const container = document.createElement('div');
            container.innerHTML = containerHTML;
            document.body.appendChild(container);
        }

        function handleOptionClick() {
            const type = $(this).data('opt');
            $(this).toggleClass('active');
            self.options[type] = !self.options[type];
            localStorage.setItem('ah-' + type, self.options[type] ? 1 : 0);

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
                self.options.rarity.push(rarity);
            } else {
                self.options.rarity = self.options.rarity.filter(r => r !== rarity);
            }
            localStorage.setItem('ah-hRarity', JSON.stringify(self.options.rarity));
        }

        function handleLabelClick(e) {
            if ($(e.target).is("input")) return;
            $(this).prev().trigger('click');
        }

        function handleManualHealClick() {
            self.autoHeal();
        }

        function handleMinHealHpPercentChange() {
            let minHealHpPercent = $(this).val();
            const minVal = parseInt($(this).attr("min"));
            const maxVal = parseInt($(this).attr("max"));

            if (minHealHpPercent === 0 || minHealHpPercent === "" || minHealHpPercent > maxVal || minHealHpPercent < minVal) {
                return;
            }

            self.options.hMinHealHpPercent = minHealHpPercent;
            localStorage.setItem('ah-hMinHealHpPercent', minHealHpPercent);
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
            localStorage.setItem('ah-hMinPotionHealing', minPotionHealing);
        }

        function handleMinPotionHealingFocusOut() {
            let minPotionHealing = $(this).val();
            const minVal = parseInt($(this).attr("min"));

            if (minPotionHealing === "" || minPotionHealing < minVal) {
                self.options.hMinPotionHealing = 0;
                localStorage.setItem('ah-hMinPotionHealing', 0);
                $(this).val(0);
            }
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
            let isDragging = false;
            let offsetX = 0, offsetY = 0;

            $header.on('mousedown', function(e) {
                isDragging = true;
                offsetX = e.clientX - $container.offset().left;
                offsetY = e.clientY - $container.offset().top;
                $header.css('cursor', 'grabbing');
            });

            $(document).on('mousemove', function(e) {
                if (isDragging) {
                    const left = e.clientX - offsetX;
                    const top = e.clientY - offsetY;
                    $container.css({ left: `${left}px`, top: `${top}px` });
                    ensureInBounds($container);
                }
            });

            $(document).on('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    $header.css('cursor', 'grab');
                    const left = $container.css('left');
                    const top = $container.css('top');
                    localStorage.setItem('ah-c-pos', JSON.stringify({ left, top }));
                }
            });
        }

        function restoreContainerPosition($container) {
            const savedPosition = localStorage.getItem('ah-c-pos');
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
                localStorage.setItem('ah-shrinked', self.options.shrinked ? 1 : 0);

                if (self.options.shrinked) {
                    $('#ah-expand-icon').css({transform: 'rotate(0deg)'});

                    $body.stop(true, true).slideToggle();
                    $('.ah-h-big').stop(true, true).fadeToggle("fast");

                    setTimeout(() => {
                        $('.ah-h-small').stop(true, true).fadeToggle("fast");
                        $('#ah-container').toggleClass('shrinked');
                    }, 400);
                } else {
                    $('#ah-expand-icon').css({transform: 'rotate(180deg)'});

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
            $('#heal-active-checkbox, #opt-potion-heal, #opt-full-heal, #opt-percent-heal, #opt-heal-to-full, #opt-notify, #opt-show-hp-display').on('click', handleOptionClick);
            $('#opt-rarity-p, #opt-rarity-u, #opt-rarity-h, #opt-rarity-ul, #opt-rarity-l').on('click', handleRarityClick);
            $('#ah-container-body div.label').on('click', handleLabelClick);
            $('#h-manual-heal-btn').on('click', handleManualHealClick);
            $('#hMinHealHpPercent').on('input change', handleMinHealHpPercentChange).on('focusout', handleMinHealHpPercentFocusOut);
            $('#hMinPotionHealing').on('input change', handleMinPotionHealingChange).on('focusout', handleMinPotionHealingFocusOut);

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

    useItem(item) {
        const { name, id } = item;

        unsafeWindow._g(`moveitem&st=1&id=${id}`, () => {
            setTimeout(() => this.autoHeal(), this.healInterval);
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
            .filter((item) => item._cachedStats.hasOwnProperty("leczy"))
            .filter((item) => this.options.rarity.includes( this.rarityDict[item._cachedStats.rarity] ))
            .filter((item) => item._cachedStats.leczy >= this.options.hMinPotionHealing)
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
            .filter((item) => item._cachedStats.hasOwnProperty("fullheal"))
            .filter((item) => this.options.rarity.includes( this.rarityDict[item._cachedStats.rarity] ))
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
            .filter((item) => item._cachedStats.hasOwnProperty("perheal"))
            .filter((item) => this.options.rarity.includes( this.rarityDict[item._cachedStats.rarity] ))
            .filter((item) => item._cachedStats.perheal <= ((maxhp - hp) * 100) / maxhp)
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

    autoHeal() {
        if (!this.options.active || this.Engine.dead) {
            return;
        }

        const hp = this.hp ?? this.Engine.hero.d.warrior_stats.hp;
        const maxhp = this.maxhp ?? this.Engine.hero.d.warrior_stats.maxhp;

        if (hp < maxhp) {
            const lvl = this.Engine.hero.d.lvl;

            const allPotions = this.getPotions(hp, maxhp, lvl);
            const potions = allPotions.filter((item) => item._cachedStats.leczy <= maxhp - hp);
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
                this.useItem(item);
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
